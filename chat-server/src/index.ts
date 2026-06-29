import http from "http";
import compression from "compression";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { isDatabaseConfigured } from "../../lib/env";
import { sendOfflineChatNotification } from "../../lib/notifications";
import { publicEnv } from "../../lib/public-env";

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
const primaryAdminId = "primary-admin";

async function setAdminPresence(onlineStatus: boolean) {
  if (!isDatabaseConfigured()) return;

  await prisma.adminPresence.upsert({
    where: { adminId: primaryAdminId },
    update: { onlineStatus, lastSeenAt: new Date() },
    create: { adminId: primaryAdminId, onlineStatus, lastSeenAt: new Date() }
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
    messages: thread.messages
  }));
}

async function broadcastThreads() {
  const threads = await getThreads();
  io.to(adminRoom).emit("admin:threads", threads);
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
    adminId?: string;
    customerName?: string;
    phone?: string;
    orderNumber?: string;
  };

  if (auth.role === "admin") {
    socket.join(adminRoom);
    await setAdminPresence(true);
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
    const chat = await findOrCreateCustomerChat({
      customerName: auth.customerName,
      phone: auth.phone,
      orderNumber: auth.orderNumber
    });

    socket.data.chatId = chat.id;
    socket.data.customerName = auth.customerName;
    socket.data.phone = auth.phone;
    socket.join(`chat:${chat.id}`);
    socket.emit("chat:history", chat.messages ?? []);
    socket.emit("admin:status", (io.sockets.adapter.rooms.get(adminRoom)?.size ?? 0) > 0);
  }

  socket.on("chat:typing", ({ typing, chatId }: { typing: boolean; chatId?: string }) => {
    const resolvedChatId = auth.role === "admin" ? chatId : socket.data.chatId;
    if (!resolvedChatId) return;

    if (auth.role === "admin") {
      io.to(`chat:${resolvedChatId}`).emit("chat:typing", typing);
    } else {
      io.to(adminRoom).emit("chat:typing", typing);
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
          senderType: isAdmin ? "ADMIN" : "CUSTOMER",
          seen: isAdmin,
          createdAt: new Date()
        };

    const messagePayload = {
      ...message,
      clientId: payload.clientId
    };

    if (isDatabaseConfigured()) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });
    }

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
      await setAdminPresence(false);
      broadcastAdminStatus();
    }
  });
});

const port = Number(process.env.PORT ?? 4001);
server.listen(port, () => {
  console.log(`Chat server listening on ${port}`);
});
