import { dbQuery, prisma } from "@/lib/prisma";
import {
  isLikelyHumanName,
  isValidIndianMobile,
  normalizeIndianMobile,
  sanitizeHumanName
} from "@/lib/chat";
import { sendOfflineChatNotification } from "@/lib/notifications";

type ChatMessagePayload = {
  id: string;
  chatId: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
  clientId?: string;
};

type ChatThreadPayload = {
  id: string;
  customerName: string;
  phone: string;
  orderId?: string | null;
  unreadCount: number;
  customerOnline: boolean;
  customerLastSeenAt: string | null;
  messages: ChatMessagePayload[];
};

function mapMessage(
  message: {
    id: string;
    chatId: string;
    senderType: "CUSTOMER" | "ADMIN";
    message: string;
    createdAt: Date;
    clientId?: string | null;
  },
  customerName: string
): ChatMessagePayload {
  return {
    id: message.id,
    chatId: message.chatId,
    senderType: message.senderType,
    senderName: message.senderType === "ADMIN" ? "Admin" : customerName,
    message: message.message,
    createdAt: message.createdAt.toISOString(),
    clientId: message.clientId ?? undefined
  };
}

function formatOrderStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type CustomerPresenceState = {
  online: boolean;
  lastSeenAt: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var saswatiChatPresence: Map<string, CustomerPresenceState> | undefined;
}

function getCustomerPresenceStore() {
  if (!global.saswatiChatPresence) {
    global.saswatiChatPresence = new Map<string, CustomerPresenceState>();
  }

  return global.saswatiChatPresence;
}

function getCustomerPresence(chatId: string): CustomerPresenceState {
  return getCustomerPresenceStore().get(chatId) ?? { online: false, lastSeenAt: null };
}

async function broadcast(topic: string, event: string, payload: Record<string, unknown>) {
  await dbQuery(
    `select realtime.send($1::jsonb, $2, $3, false)`,
    [JSON.stringify(payload), event, topic]
  );
}

export async function isAnyAdminOnline() {
  const { rows } = await dbQuery<{ online: boolean }>(
    `
      select exists(
        select 1
        from "AdminPresence"
        where "onlineStatus" = true
      ) as online
    `
  );

  return Boolean(rows[0]?.online);
}

async function getUnreadCounts() {
  const { rows } = await dbQuery<{ chatId: string; unreadCount: number }>(
    `
      select
        "chatId" as "chatId",
        count(*)::int as "unreadCount"
      from "ChatMessage"
      where "senderType" = 'CUSTOMER' and seen = false
      group by "chatId"
    `
  );

  return new Map(rows.map((row) => [row.chatId, row.unreadCount]));
}

export async function findOrCreateCustomerChat(input: {
  customerName: string;
  phone: string;
  orderNumber?: string | null;
}) {
  const customerName = sanitizeHumanName(input.customerName);
  const phone = normalizeIndianMobile(input.phone);

  if (!isLikelyHumanName(customerName) || !isValidIndianMobile(phone)) {
    throw new Error("Invalid customer details.");
  }

  const order = input.orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber: input.orderNumber } })
    : null;

  let chat = await prisma.chat.findFirst({
    where: order?.id
      ? {
          phone,
          orderId: order.id
        }
      : {
          customerName,
          phone,
          orderId: null
        }
  });

  let created = false;
  if (!chat) {
    created = true;
    chat = await prisma.chat.create({
      data: {
        customerName,
        phone,
        orderId: order?.id ?? null
      }
    });
  }

  const hydrated = await prisma.chat.findUnique({
    where: { id: chat.id },
    include: { messages: true }
  });

  if (!hydrated) {
    throw new Error("Chat not found.");
  }

  if (created) {
    await Promise.allSettled([
      broadcast("chat-admin-discovery", "refresh", {
        chatId: hydrated.id,
        reason: "created"
      })
    ]);
  }

  return {
    chatId: hydrated.id,
    adminOnline: await isAnyAdminOnline(),
    messages: (hydrated.messages ?? []).map((message: any) =>
      mapMessage(message, hydrated.customerName)
    )
  };
}

export async function getAdminThreads(): Promise<ChatThreadPayload[]> {
  const [chats, unreadCounts] = await Promise.all([
    prisma.chat.findMany({
      include: { messages: true },
      orderBy: { updatedAt: "desc" }
    }),
    getUnreadCounts()
  ]);

  return chats.map((chat: any) => ({
    id: chat.id,
    customerName: chat.customerName,
    phone: chat.phone,
    orderId: chat.orderId ?? null,
    unreadCount: unreadCounts.get(chat.id) ?? 0,
    customerOnline: getCustomerPresence(chat.id).online,
    customerLastSeenAt: getCustomerPresence(chat.id).lastSeenAt,
    messages: chat.messages?.length
      ? [mapMessage(chat.messages.at(-1), chat.customerName)]
      : []
  }));
}

export async function getAdminThread(chatId: string): Promise<ChatThreadPayload | null> {
  await prisma.chatMessage.updateMany({
    where: {
      chatId,
      senderType: "CUSTOMER",
      seen: false
    },
    data: {
      seen: true
    }
  });

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: true }
  });

  if (!chat) return null;

  await Promise.allSettled([
    broadcast(`chat:${chatId}`, "seen", { chatId }),
    broadcast("chat-admin-discovery", "refresh", { chatId, reason: "seen" })
  ]);

  return {
    id: chat.id,
    customerName: chat.customerName,
    phone: chat.phone,
    orderId: chat.orderId ?? null,
    unreadCount: 0,
    customerOnline: getCustomerPresence(chat.id).online,
    customerLastSeenAt: getCustomerPresence(chat.id).lastSeenAt,
    messages: (chat.messages ?? []).map((message: any) =>
      mapMessage(message, chat.customerName)
    )
  };
}

export async function sendChatMessage(input: {
  chatId: string;
  senderType: "CUSTOMER" | "ADMIN";
  message: string;
  customerName?: string;
  phone?: string;
  clientId?: string;
}) {
  const messageText = input.message.trim();
  if (!messageText) {
    throw new Error("Message is required.");
  }

  const chat = await prisma.chat.findUnique({
    where: { id: input.chatId },
    include: { order: true }
  });

  if (!chat) {
    throw new Error("Chat not found.");
  }

  if (input.senderType === "CUSTOMER") {
    const customerName = sanitizeHumanName(input.customerName ?? "");
    const phone = normalizeIndianMobile(input.phone ?? "");

    if (
      !isLikelyHumanName(customerName) ||
      !isValidIndianMobile(phone) ||
      customerName.toLowerCase() !== chat.customerName.toLowerCase() ||
      phone !== normalizeIndianMobile(chat.phone)
    ) {
      throw new Error("Invalid customer details.");
    }
  }

  const saved = await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderType: input.senderType,
      message: messageText,
      clientId: input.clientId ?? null,
      seen: input.senderType === "ADMIN"
    }
  });

  await prisma.chat.update({
    where: { id: chat.id },
    data: {
      updatedAt: new Date()
    }
  });

  const payload = {
    ...mapMessage(saved, chat.customerName),
    clientId: input.clientId
  };

  await Promise.allSettled([
    broadcast(`chat:${chat.id}`, "message", payload),
    broadcast("chat-admin-discovery", "refresh", {
      chatId: chat.id,
      senderType: input.senderType
    })
  ]);

  if (input.senderType === "CUSTOMER" && !(await isAnyAdminOnline())) {
    await Promise.allSettled([
      sendOfflineChatNotification({
        customerName: chat.customerName,
        phone: chat.phone,
        message: messageText,
        orderNumber: chat.order?.orderNumber ?? null
      })
    ]);
  }

  return payload;
}

export async function notifyOrderStatusChange(input: {
  orderNumber: string;
  customerName: string;
  phone: string;
  orderStatus: string;
}) {
  const chat = await findOrCreateCustomerChat({
    customerName: input.customerName,
    phone: input.phone,
    orderNumber: input.orderNumber
  });

  return sendChatMessage({
    chatId: chat.chatId,
    senderType: "ADMIN",
    message: `Order status updated to ${formatOrderStatusLabel(input.orderStatus)}.`
  });
}

export async function setAdminPresence(adminId: string, onlineStatus: boolean) {
  await prisma.adminPresence.upsert({
    where: { adminId },
    update: {
      onlineStatus,
      lastSeenAt: new Date()
    },
    create: {
      adminId,
      onlineStatus,
      lastSeenAt: new Date()
    }
  });

  const anyOnline = await isAnyAdminOnline();
  await Promise.allSettled([
    broadcast("chat-admin-presence", "status", { online: anyOnline })
  ]);
  return anyOnline;
}

export async function setCustomerPresence(chatId: string, online: boolean) {
  const store = getCustomerPresenceStore();
  const next = {
    online,
    lastSeenAt: online ? store.get(chatId)?.lastSeenAt ?? null : new Date().toISOString()
  };

  store.set(chatId, next);

  await Promise.allSettled([
    broadcast(`chat:${chatId}`, "presence", {
      chatId,
      online: next.online,
      lastSeenAt: next.lastSeenAt
    }),
    broadcast("chat-admin-discovery", "refresh", {
      chatId,
      reason: "presence"
    })
  ]);

  return next;
}
