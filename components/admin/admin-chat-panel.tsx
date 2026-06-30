"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Paperclip, SendHorizontal } from "lucide-react";
import { publicEnv } from "@/lib/public-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatChatTime, parseChatAttachment, serializeChatAttachment, type ChatAttachment } from "@/lib/chat";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  chatId: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
};

type Thread = {
  id: string;
  customerName: string;
  phone: string;
  orderId?: string | null;
  unreadCount?: number;
  messages?: Message[];
};

type TypingState = {
  chatId?: string;
  typing: boolean;
  senderType: "CUSTOMER" | "ADMIN";
};

function appendUniqueMessage(messages: Message[] = [], nextMessage: Message) {
  if (messages.some((message) => message.id === nextMessage.id)) return messages;
  return [...messages, nextMessage];
}

function mergeUniqueMessages(messages: Message[] = [], nextMessages: Message[] = []) {
  return nextMessages.reduce((current, message) => appendUniqueMessage(current, message), messages);
}

function getThreadPreview(thread: Thread) {
  const lastMessage = thread.messages?.at(-1);
  if (!lastMessage) return "Tap to open this conversation";

  const attachment = parseChatAttachment(lastMessage.message);
  if (attachment) return `Attachment: ${attachment.name}`;
  return lastMessage.message;
}

function AttachmentBubble({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="block space-y-3"
    >
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
        <span className="font-medium">{message.senderType === "ADMIN" ? "Admin" : customerName || message.senderName}</span>
        {" · "}
        {formatChatTime(message.createdAt)}
      </div>
    </div>
  );
}

export function AdminChatPanel({ accessToken }: { accessToken: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [typingState, setTypingState] = useState<TypingState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id ?? null;
  }, [activeThread?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeThread?.messages, typingState]);

  useEffect(() => {
    if (!accessToken) {
      setError("Admin session missing. Please sign in again.");
      return;
    }

    const socket = io(publicEnv.chatServerUrl, {
      transports: ["websocket"],
      auth: {
        role: "admin",
        accessToken
      }
    });

    socket.on("connect", () => setError(""));
    socket.on("connect_error", () => {
      setError("Could not verify admin chat access.");
    });
    socket.on("admin:threads", (nextThreads: Thread[]) => {
      setThreads(nextThreads);
      setActiveThread((current) => {
        if (!current) return current;
        const refreshed = nextThreads.find((thread) => thread.id === current.id);
        return refreshed
          ? {
              ...current,
              ...refreshed,
              messages:
                current.messages?.length
                  ? mergeUniqueMessages(current.messages, refreshed.messages)
                  : refreshed.messages ?? current.messages
            }
          : current;
      });
    });
    socket.on("admin:thread", (thread: Thread) => {
      setActiveThread(thread);
      setThreads((current) =>
        current.some((entry) => entry.id === thread.id)
          ? current.map((entry) => (entry.id === thread.id ? { ...entry, ...thread } : entry))
          : [thread, ...current]
      );
    });
    socket.on("chat:typing", (nextTypingState: TypingState) => {
      if (nextTypingState.senderType === "CUSTOMER") {
        setTypingState(nextTypingState);
      }
    });
    socket.on("chat:message", (message: Message) => {
      setThreads((current) =>
        current.map((thread) =>
          thread.id === message.chatId
            ? {
                ...thread,
                unreadCount:
                  message.senderType === "CUSTOMER"
                    ? (thread.unreadCount ?? 0) + (activeThreadIdRef.current === thread.id ? 0 : 1)
                    : thread.unreadCount ?? 0,
                messages: appendUniqueMessage(thread.messages, message)
              }
            : thread
        )
      );
      setActiveThread((current) =>
        current?.id === message.chatId
          ? {
              ...current,
              unreadCount: 0,
              messages: appendUniqueMessage(current.messages, message)
            }
          : current
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  function openThread(thread: Thread) {
    setActiveThread((current) =>
      current?.id === thread.id
        ? current
        : {
            ...thread,
            messages: thread.messages ?? []
          }
    );
    setTypingState(null);
    socketRef.current?.emit("admin:open-thread", { chatId: thread.id });
  }

  function sendMessage() {
    if (!text.trim() || !activeThread) return;

    socketRef.current?.emit("chat:message", {
      chatId: activeThread.id,
      message: text.trim()
    });
    setText("");
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
    const result = await response.json();
    setUploadingAttachment(false);

    if (!result.ok) {
      setError(result.error ?? "Could not upload the attachment.");
      return;
    }

    socketRef.current?.emit("chat:message", {
      chatId: activeThread.id,
      message: serializeChatAttachment({
        url: result.url,
        name: result.name,
        mimeType: result.mimeType
      })
    });
  }

  const customerTyping =
    Boolean(activeThread?.id) &&
    typingState?.typing &&
    typingState.senderType === "CUSTOMER" &&
    typingState.chatId === activeThread?.id;

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-2xl">Conversations</p>
            <p className="mt-1 text-sm text-stone-500">Open any customer thread and reply in real time.</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-stone-600">
            {threads.length} active
          </span>
        </div>
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        <div className="mt-4 space-y-3">
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
                onClick={() => openThread(thread)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">{thread.customerName}</p>
                    <p className="text-xs text-stone-500">{thread.phone}</p>
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
          <p className="mt-1 text-sm text-stone-500">
            {activeThread ? `${activeThread.phone}${activeThread.orderId ? ` · Order linked` : ""}` : "Customer messages will appear here in a WhatsApp-style thread."}
          </p>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/60 px-4 py-5">
          {activeThread?.messages?.length ? (
            activeThread.messages.map((message) => (
              <MessageBubble
                key={message.id}
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
              {uploadingAttachment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
            <Input
              placeholder={activeThread ? "Reply to customer" : "Select a thread first"}
              value={text}
              disabled={!activeThread}
              onChange={(event) => {
                setText(event.target.value);
                if (activeThread) {
                  socketRef.current?.emit("chat:typing", {
                    typing: Boolean(event.target.value.trim()),
                    chatId: activeThread.id
                  });
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={!text.trim() || !activeThread}>
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
