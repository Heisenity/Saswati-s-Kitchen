"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Paperclip, SendHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  formatChatTime,
  parseChatAttachment,
  serializeChatAttachment,
  type ChatAttachment
} from "@/lib/chat";
import { cn } from "@/lib/utils";
import { toDateValue } from "@/lib/utils";

type Message = {
  id: string;
  chatId: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
  clientId?: string;
};

type Thread = {
  id: string;
  customerName: string;
  phone: string;
  orderId?: string | null;
  unreadCount?: number;
  customerOnline?: boolean;
  customerLastSeenAt?: string | null;
  messages?: Message[];
};

type TypingState = {
  typing: boolean;
  senderType: "CUSTOMER" | "ADMIN";
};

function dedupeMessages(messages: Message[] = []) {
  return messages.filter(
    (message, index, current) =>
      current.findIndex((entry) => entry.id === message.id) === index
  );
}

function appendUniqueMessage(messages: Message[] = [], nextMessage: Message) {
  const optimisticIndex = nextMessage.clientId
    ? messages.findIndex((message) => message.id === nextMessage.clientId)
    : -1;

  if (optimisticIndex >= 0) {
    return messages.map((message, index) => (index === optimisticIndex ? nextMessage : message));
  }

  if (messages.some((message) => message.id === nextMessage.id)) return messages;
  return [...messages, nextMessage];
}

function getThreadPreview(thread: Thread) {
  const lastMessage = thread.messages?.at(-1);
  if (!lastMessage) return "Tap to open this conversation";

  const attachment = parseChatAttachment(lastMessage.message);
  if (attachment) return `Attachment: ${attachment.name}`;
  return lastMessage.message;
}

function formatLastSeen(value?: string | null) {
  if (!value) return "Offline";

  return `Last seen ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(toDateValue(value))}`;
}

function AttachmentBubble({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="block space-y-3">
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-56 w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-black/5 px-3 py-3 text-left text-current">
          <FileText className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{attachment.name}</p>
            <p className="text-xs opacity-80">Open PDF</p>
          </div>
        </div>
      )}
      <p className="text-xs font-medium underline underline-offset-4">Open attachment</p>
    </a>
  );
}

function MessageBubble({
  message,
  customerName
}: {
  message: Message;
  customerName?: string;
}) {
  const attachment = parseChatAttachment(message.message);

  return (
    <div
      className={cn(
        "flex max-w-[82%] flex-col",
        message.senderType === "ADMIN" ? "ml-auto items-end text-right" : "items-start text-left"
      )}
    >
      <div
        className={cn(
          "rounded-[22px] px-4 py-3 text-sm shadow-sm",
          message.senderType === "ADMIN"
            ? "bg-primary text-white"
            : "border border-border bg-white text-foreground"
        )}
      >
        {attachment ? <AttachmentBubble attachment={attachment} /> : message.message}
      </div>
      <div className="mt-1 px-1 text-[11px] text-stone-500">
        <span className="font-medium">
          {message.senderType === "ADMIN" ? "Admin" : customerName || message.senderName}
        </span>
        {" · "}
        {formatChatTime(message.createdAt)}
      </div>
    </div>
  );
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function AdminChatPanel() {
  const supabase = useRef(createClient()).current;
  const discoveryChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [typingState, setTypingState] = useState<TypingState | null>(null);

  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id ?? null;
  }, [activeThread?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeThread?.messages, typingState]);

  async function fetchThreads() {
    const response = await fetch("/api/admin/chat/threads");
    const result = await parseJson<{ ok: boolean; threads?: Thread[]; error?: string }>(response);

    if (!result.ok || !result.threads) {
      setError(result.error ?? "Could not load chat threads.");
      return;
    }

    setError("");
    setThreads(result.threads);
    setActiveThread((current) =>
      current
        ? (() => {
            const refreshed = result.threads?.find((thread) => thread.id === current.id);
            return refreshed
              ? {
                  ...current,
                  ...refreshed,
                  messages: dedupeMessages(current.messages)
                }
              : current;
          })()
        : current
    );
  }

  async function openThread(thread: Thread) {
    const response = await fetch(`/api/admin/chat/threads/${thread.id}`);
    const result = await parseJson<{ ok: boolean; thread?: Thread; error?: string }>(response);

    if (!result.ok || !result.thread) {
      setError(result.error ?? "Could not open this conversation.");
      return;
    }

    setError("");
    setTypingState(null);
    setActiveThread({
      ...result.thread,
      messages: dedupeMessages(result.thread.messages)
    });
    setThreads((current) =>
      current.map((entry) =>
        entry.id === result.thread?.id ? { ...entry, ...result.thread, unreadCount: 0 } : entry
      )
    );
  }

  useEffect(() => {
    void fetchThreads();

    const presenceBody = JSON.stringify({ online: true });
    void fetch("/api/admin/chat/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: presenceBody
    });

    heartbeatRef.current = setInterval(() => {
      void fetch("/api/admin/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: presenceBody
      });
    }, 30_000);

    const discoveryChannel = supabase
      .channel("chat-admin-discovery", {
        config: { broadcast: { self: true } }
      })
      .on("broadcast", { event: "refresh" }, () => {
        void fetchThreads();
      })
      .subscribe();

    discoveryChannelRef.current = discoveryChannel;

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      void fetch("/api/admin/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: false }),
        keepalive: true
      });
      if (discoveryChannelRef.current) {
        void supabase.removeChannel(discoveryChannelRef.current);
        discoveryChannelRef.current = null;
      }
    };
  }, [supabase]);

  useEffect(() => {
    if (!activeThread?.id) {
      if (roomChannelRef.current) {
        void supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
      return;
    }

    if (roomChannelRef.current) {
      void supabase.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }

    const roomChannel = supabase
      .channel(`chat:${activeThread.id}`, {
        config: { broadcast: { self: true, ack: true } }
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const message = payload as Message;
        setActiveThread((current) =>
          current?.id === message.chatId
            ? {
                ...current,
                unreadCount: 0,
                messages: dedupeMessages(appendUniqueMessage(current.messages, message))
              }
            : current
        );
        setThreads((current) =>
          current.map((thread) =>
            thread.id === message.chatId
              ? {
                  ...thread,
                  unreadCount:
                    message.senderType === "CUSTOMER" && activeThreadIdRef.current !== thread.id
                      ? (thread.unreadCount ?? 0) + 1
                      : 0,
                  messages: [message]
                }
              : thread
          )
        );
      })
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const next = payload as { chatId?: string; online?: boolean; lastSeenAt?: string | null };
        if (!next.chatId) return;

        setActiveThread((current) => {
          if (!current || current.id !== next.chatId) return current;

          return {
            ...current,
            customerOnline: Boolean(next.online),
            customerLastSeenAt: next.lastSeenAt ?? null
          };
        });
        setThreads((current) =>
          current.map((thread) =>
            thread.id === next.chatId
              ? {
                  ...thread,
                  customerOnline: Boolean(next.online),
                  customerLastSeenAt: next.lastSeenAt ?? null
                }
              : thread
          )
        );
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const next = payload as TypingState;
        if (next.senderType === "CUSTOMER") {
          setTypingState(next);
        }
      })
      .on("broadcast", { event: "seen" }, () => {
        setThreads((current) =>
          current.map((thread) =>
            thread.id === activeThreadIdRef.current ? { ...thread, unreadCount: 0 } : thread
          )
        );
      })
      .subscribe();

    roomChannelRef.current = roomChannel;

    return () => {
      if (roomChannelRef.current) {
        void supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
    };
  }, [activeThread?.id, supabase]);

  function sendTyping(value: boolean) {
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        typing: value,
        senderType: "ADMIN"
      }
    });
  }

  async function sendMessage(messageText: string) {
    if (!activeThread || !messageText.trim()) return;

    const clientId = crypto.randomUUID();
    const optimistic = {
      id: clientId,
      chatId: activeThread.id,
      senderType: "ADMIN" as const,
      senderName: "Admin",
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
      clientId
    };

    setActiveThread((current) =>
      current?.id === activeThread.id
        ? {
            ...current,
            messages: [...(current.messages ?? []), optimistic]
          }
        : current
    );
    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThread.id ? { ...thread, messages: [optimistic] } : thread
      )
    );

    const response = await fetch("/api/admin/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: activeThread.id,
        message: messageText,
        clientId
      })
    });
    const result = await parseJson<{ ok: boolean; message?: Message; error?: string }>(response);

    if (!result.ok || !result.message) {
      setError(result.error ?? "Could not send message right now.");
      setActiveThread((current) =>
        current?.id === activeThread.id
          ? {
              ...current,
              messages: current.messages?.filter((entry) => entry.id !== clientId)
            }
          : current
      );
      setThreads((current) =>
        current.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: thread.messages?.filter((entry) => entry.id !== clientId)
              }
            : thread
        )
      );
      return;
    }

    setError("");
    const confirmedMessage = { ...result.message, clientId } as Message;
    setActiveThread((current) =>
      current?.id === activeThread.id
        ? {
          ...current,
          messages: dedupeMessages(appendUniqueMessage(current.messages, confirmedMessage))
        }
        : current
    );
    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThread.id ? { ...thread, messages: [confirmedMessage] } : thread
      )
    );
  }

  async function handleSend() {
    if (!text.trim() || !activeThread) return;
    const messageText = text.trim();
    setText("");
    sendTyping(false);
    await sendMessage(messageText);
  }

  async function uploadAttachment(file: File) {
    if (!activeThread) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
    if (!allowedTypes.has(file.type)) {
      setError("Only JPG, PNG, or PDF files can be sent.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Attachment must be 5MB or smaller.");
      return;
    }

    setUploadingAttachment(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/chat-attachment", {
      method: "POST",
      body: formData
    });
    const result = await parseJson<{
      ok: boolean;
      url?: string;
      name?: string;
      mimeType?: string;
      error?: string;
    }>(response);
    setUploadingAttachment(false);

    if (!result.ok || !result.url || !result.name || !result.mimeType) {
      setError(result.error ?? "Could not upload the attachment.");
      return;
    }

    await sendMessage(
      serializeChatAttachment({
        url: result.url,
        name: result.name,
        mimeType: result.mimeType
      })
    );
  }

  const customerTyping =
    Boolean(activeThread?.id) &&
    typingState?.typing &&
    typingState.senderType === "CUSTOMER";

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-2xl">Conversations</p>
            <p className="mt-1 text-sm text-stone-500">
              Open any customer thread and reply in real time.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-stone-600">
            {threads.length} active
          </span>
        </div>
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        <div className="mt-4 max-h-[68vh] space-y-3 overflow-y-auto pr-1">
          {threads.map((thread) => {
            const selected = activeThread?.id === thread.id;

            return (
              <button
                key={thread.id}
                className={cn(
                  "w-full rounded-[24px] border px-4 py-3 text-left transition",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-white hover:border-primary/30 hover:bg-white"
                )}
                onClick={() => void openThread(thread)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">{thread.customerName}</p>
                    <p className="text-xs text-stone-500">{thread.phone}</p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      {thread.customerOnline ? "Online now" : formatLastSeen(thread.customerLastSeenAt)}
                    </p>
                  </div>
                  {thread.unreadCount ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                      {thread.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-stone-600">{getThreadPreview(thread)}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex min-h-[720px] flex-col overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <p className="font-serif text-2xl">{activeThread?.customerName ?? "Select a thread"}</p>
          {activeThread ? (
            <p className="mt-1 text-sm text-stone-500">
              {`${activeThread.phone}${activeThread.orderId ? ` · Order linked` : ""}`}
            </p>
          ) : null}
          {activeThread ? (
            <p className="mt-1 text-xs font-medium text-stone-500">
              {activeThread.customerOnline
                ? "Online now"
                : formatLastSeen(activeThread.customerLastSeenAt)}
            </p>
          ) : null}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/60 px-4 py-5">
          {activeThread?.messages?.length ? (
            activeThread.messages.map((message, index) => (
              <MessageBubble
                key={`${message.id}-${index}`}
                message={message}
                customerName={activeThread.customerName}
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-border bg-white/80 p-6 text-center text-sm text-stone-500">
              Select a customer thread to read and reply.
            </div>
          )}
          {customerTyping ? <p className="text-xs text-stone-500">Customer is typing…</p> : null}
        </div>

        <div className="border-t border-border bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-stone-500">
            <span>Send reply or attachment</span>
            <span>JPG, PNG, PDF up to 5MB</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeThread || uploadingAttachment}
              aria-label="Upload attachment"
            >
              {uploadingAttachment ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>
            <Input
              placeholder={activeThread ? "Reply to customer" : "Select a thread first"}
              value={text}
              disabled={!activeThread}
              onChange={(event) => {
                setText(event.target.value);
                sendTyping(Boolean(event.target.value.trim()));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button onClick={() => void handleSend()} disabled={!text.trim() || !activeThread}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAttachment(file);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </Card>
    </div>
  );
}
