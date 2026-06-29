import http from "http";
import compression from "compression";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { isDatabaseConfigured } from "../../lib/env";
import { sendOfflineChatNotification } from "../../lib/notifications";
import { publicEnv } from "../../lib/public-env";
import { isLikelyHumanName, isValidIndianMobile, normalizeIndianMobile, sanitizeHumanName } from "../../lib/chat";

const app = express();
app.use(compression());
app.use(cors({ origin: publicEnv.appUrl, credentials: true }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, databaseConfigured: isDatabaseConfigured() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: publicEnv.appUrl,
    credentials: true
  },
  transports: ["websocket"]
});

const adminRoom = "admins";

function toMessagePayload(
  message: {
    id: string;
    chatId: string;
    senderType: "CUSTOMER" | "ADMIN";
    message: string;
    createdAt: Date;
  },
  customerName: string,
  clientId?: string
) {
  return {
    ...message,
    senderName: message.senderType === "ADMIN" ? "Admin" : customerName,
    createdAt: message.createdAt.toISOString(),
    clientId
  };
}

async function setAdminPresence(adminId: string, onlineStatus: boolean) {
  if (!isDatabaseConfigured()) return;

  await prisma.adminPresence.upsert({
    where: { adminId },
    update: { onlineStatus, lastSeenAt: new Date() },
    create: { adminId, onlineStatus, lastSeenAt: new Date() }
  });
}

async function getThreads() {
  if (!isDatabaseConfigured()) return [];

  const threads = await prisma.chat.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30
      }
    }
  });

  return threads.map((thread) => ({
    id: thread.id,
    customerName: thread.customerName,
    phone: thread.phone,
    orderId: thread.orderId,
    unreadCount: thread.messages.filter((message) => !message.seen && message.senderType === "CUSTOMER").length,
    messages: thread.messages.map((message) => toMessagePayload(message, thread.customerName))
  }));
}

async function broadcastThreads() {
  const threads = await getThreads();
  io.to(adminRoom).emit("admin:threads", threads);
}

async function getAdminUser(accessToken: string) {
  if (!publicEnv.supabasePublishableKey) return null;

  const response = await fetch(`${publicEnv.supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: publicEnv.supabasePublishableKey
    }
  });

  if (!response.ok) return null;

  const user = (await response.json()) as { id: string };
  if (!isDatabaseConfigured()) return user;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (profile?.role !== "ADMIN") return null;
  return user;
}

function broadcastAdminStatus() {
  const isOnline = (io.sockets.adapter.rooms.get(adminRoom)?.size ?? 0) > 0;
  io.emit("admin:status", isOnline);
}

async function findOrCreateCustomerChat(input: {
  customerName: string;
  phone: string;
  orderNumber?: string;
}) {
  if (!isDatabaseConfigured()) {
    return {
      id: `ephemeral-${input.phone}`,
      customerName: input.customerName,
      phone: input.phone,
      orderId: null,
      messages: []
    };
  }

  const order = input.orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber: input.orderNumber } })
    : null;

  const existing = await prisma.chat.findFirst({
    where: {
      phone: input.phone,
      orderId: order?.id ?? null
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30
      }
    }
  });

  if (existing) return existing;

  return prisma.chat.create({
    data: {
      customerName: input.customerName,
      phone: input.phone,
      orderId: order?.id
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30
      }
    }
  });
}

io.on("connection", async (socket) => {
  const auth = socket.handshake.auth as {
    role?: "admin" | "customer";
    accessToken?: string;
    customerName?: string;
    phone?: string;
    orderNumber?: string;
  };

  if (auth.role === "admin") {
    const adminUser =
      typeof auth.accessToken === "string"
        ? await getAdminUser(auth.accessToken)
        : null;

    if (!adminUser) {
      socket.disconnect(true);
      return;
    }

    socket.data.adminId = adminUser.id;
    socket.join(adminRoom);
    await setAdminPresence(adminUser.id, true);
    broadcastAdminStatus();
    socket.emit("admin:threads", await getThreads());

    socket.on("admin:open-thread", async ({ chatId }: { chatId: string }) => {
      if (!isDatabaseConfigured()) return;

      await prisma.chatMessage.updateMany({
        where: {
          chatId,
          senderType: "CUSTOMER",
          seen: false
        },
        data: { seen: true }
      });

      const thread = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50
          }
        }
      });

      if (thread) socket.emit("admin:thread", thread);
      await broadcastThreads();
    });
  }

  if (auth.role === "customer" && auth.customerName && auth.phone) {
    const customerName = sanitizeHumanName(auth.customerName);
    const phone = normalizeIndianMobile(auth.phone);

    if (!isLikelyHumanName(customerName) || !isValidIndianMobile(phone)) {
      socket.disconnect(true);
      return;
    }

    const chat = await findOrCreateCustomerChat({
      customerName,
      phone,
      orderNumber: auth.orderNumber
    });

    socket.data.chatId = chat.id;
    socket.data.customerName = customerName;
    socket.data.phone = phone;
    socket.join(`chat:${chat.id}`);
    socket.emit(
      "chat:history",
      (chat.messages ?? []).map((message) => toMessagePayload(message, chat.customerName))
    );
    socket.emit("admin:status", (io.sockets.adapter.rooms.get(adminRoom)?.size ?? 0) > 0);
  }

  socket.on("chat:typing", ({ typing, chatId }: { typing: boolean; chatId?: string }) => {
    const resolvedChatId = auth.role === "admin" ? chatId : socket.data.chatId;
    if (!resolvedChatId) return;

    if (auth.role === "admin") {
      io.to(`chat:${resolvedChatId}`).emit("chat:typing", { typing, senderType: "ADMIN" });
    } else {
      io.to(adminRoom).emit("chat:typing", { typing, senderType: "CUSTOMER", chatId: resolvedChatId });
    }
  });

  socket.on("chat:message", async (payload: { chatId?: string; message: string; clientId?: string }) => {
    if (!payload.message?.trim()) return;

    const isAdmin = auth.role === "admin";
    const chatId = isAdmin ? payload.chatId : socket.data.chatId;
    if (!chatId) return;

    const message = isDatabaseConfigured()
      ? await prisma.chatMessage.create({
          data: {
            chatId,
            message: payload.message.trim(),
            senderType: isAdmin ? "ADMIN" : "CUSTOMER",
            seen: isAdmin
          }
        })
      : {
          id: crypto.randomUUID(),
          chatId,
          message: payload.message.trim(),
          senderType: (isAdmin ? "ADMIN" : "CUSTOMER") as "ADMIN" | "CUSTOMER",
          seen: isAdmin,
          createdAt: new Date()
        };

    const customerName =
      auth.role === "admin"
        ? (isDatabaseConfigured()
            ? (await prisma.chat.findUnique({ where: { id: chatId }, select: { customerName: true } }))?.customerName
            : "Customer") ?? "Customer"
        : socket.data.customerName ?? "Customer";
    const messagePayload = toMessagePayload(message, customerName, payload.clientId);

    if (isDatabaseConfigured()) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });
    }

    io.to(`chat:${chatId}`).emit("chat:typing", { typing: false, senderType: isAdmin ? "ADMIN" : "CUSTOMER" });
    io.to(adminRoom).emit("chat:typing", { typing: false, senderType: isAdmin ? "ADMIN" : "CUSTOMER", chatId });
    io.to(`chat:${chatId}`).emit("chat:message", messagePayload);
    io.to(adminRoom).emit("chat:message", messagePayload);
    await broadcastThreads();

    if (!isAdmin && io.sockets.adapter.rooms.get(adminRoom)?.size !== undefined && (io.sockets.adapter.rooms.get(adminRoom)?.size ?? 0) === 0) {
      const thread = isDatabaseConfigured()
        ? await prisma.chat.findUnique({
            where: { id: chatId },
            include: { order: true }
          })
        : null;

      await sendOfflineChatNotification({
        customerName: socket.data.customerName ?? "Customer",
        phone: socket.data.phone ?? "",
        message: payload.message.trim(),
        orderNumber: thread?.order?.orderNumber
      });
    }
  });

  socket.on("disconnect", async () => {
    if (auth.role === "admin" && (io.sockets.adapter.rooms.get(adminRoom)?.size ?? 0) === 0) {
      if (typeof socket.data.adminId === "string") {
        await setAdminPresence(socket.data.adminId, false);
      }
      broadcastAdminStatus();
    }
  });
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`Chat server listening on ${port}`);
});
