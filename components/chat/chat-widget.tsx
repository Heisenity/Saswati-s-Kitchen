"use client";

import { motion } from "framer-motion";
import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, MessageCircle, SendHorizontal } from "lucide-react";
import { publicEnv } from "@/lib/public-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatChatTime, isLikelyHumanName, isValidIndianMobile, normalizeIndianMobile, parseChatAttachment, sanitizeHumanName, type ChatAttachment } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Message = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
  clientId?: string;
};

function AttachmentBubble({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="block space-y-3">
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-48 w-full rounded-2xl object-cover"
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

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [profileError, setProfileError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safeName = sanitizeHumanName(name);
  const safePhone = normalizeIndianMobile(phone);
  const profileReady = isLikelyHumanName(safeName) && isValidIndianMobile(safePhone);

  useEffect(() => {
    function handleOpenChat() {
      setOpen(true);
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-open-chat='true']")) {
        setOpen(true);
      }
    }

    window.addEventListener("saswatis:open-chat", handleOpenChat);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("saswatis:open-chat", handleOpenChat);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    const storedName = window.localStorage.getItem("saswatis-kitchen-chat-name");
    const storedPhone = window.localStorage.getItem("saswatis-kitchen-chat-phone");
    if (storedName) setName(storedName);
    if (storedPhone) setPhone(storedPhone);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!open || socketRef.current || !safeName || !safePhone || !isLikelyHumanName(safeName) || !isValidIndianMobile(safePhone)) return;

    setConnecting(true);
    setConnectionError("");

    const socket = io(publicEnv.chatServerUrl, {
      transports: ["websocket"],
      auth: {
        role: "customer",
        customerName: safeName,
        phone: safePhone,
        orderNumber: window.localStorage.getItem("saswatis-kitchen-last-order") ?? undefined
      }
    });

    socket.on("connect", () => {
      setConnecting(false);
      setConnectionError("");
      window.localStorage.setItem("saswatis-kitchen-chat-name", safeName);
      window.localStorage.setItem("saswatis-kitchen-chat-phone", safePhone);
    });
    socket.on("chat:history", (history: Message[]) => setMessages(history));
    socket.on("chat:message", (message: Message) =>
      setMessages((current) => {
        if (message.clientId) {
          return current.map((entry) =>
            entry.id === message.clientId ? { ...message, id: message.clientId } : entry
          );
        }

        return [...current, message];
      })
    );
    socket.on("chat:typing", (value: { typing: boolean; senderType: "CUSTOMER" | "ADMIN" }) => {
      if (value.senderType === "ADMIN") setTyping(value.typing);
    });
    socket.on("admin:status", (value: boolean) => setAdminOnline(value));
    socket.on("connect_error", () => {
      setConnecting(false);
      setConnectionError("Could not connect to chat right now. Please try again.");
    });
    socket.on("disconnect", () => {
      setConnecting(false);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, safeName, safePhone]);

  function validateProfile() {
    const safeName = sanitizeHumanName(name);
    const safePhone = normalizeIndianMobile(phone);

    if (!isLikelyHumanName(safeName)) {
      setProfileError("Enter a real name using letters only, for example Sayantan or Saswati Sen.");
      return false;
    }

    if (!isValidIndianMobile(safePhone)) {
      setProfileError("Enter a valid Indian mobile number with exactly 10 digits.");
      return false;
    }

    setProfileError("");
    setName(safeName);
    setPhone(safePhone);
    return true;
  }

  function startChat() {
    validateProfile();
  }

  function emitTyping() {
    socketRef.current?.emit("chat:typing", { typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", { typing: false });
    }, 900);
  }

  function sendMessage() {
    if (!text.trim() || !socketRef.current) return;

    const clientId = crypto.randomUUID();
    const optimistic = {
      id: clientId,
      senderType: "CUSTOMER" as const,
      senderName: sanitizeHumanName(name) || "You",
      message: text.trim(),
      createdAt: new Date().toISOString(),
      clientId
    };
    setMessages((current) => [...current, optimistic]);
    socketRef.current.emit("chat:message", { message: text.trim(), clientId });
    socketRef.current.emit("chat:typing", { typing: false });
    setText("");
  }

  const whatsappUrl = buildWhatsAppUrl("Hi Saswati’s Kitchen, I want to know today’s menu and delivery availability.");

  return (
    <div className="fixed bottom-5 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 sm:gap-4">
      {open ? (
        <div className="w-[min(360px,calc(100vw-2rem))] rounded-[28px] border border-border bg-card p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-xl">Live Chat</p>
              <p className="text-xs text-stone-500">
                {adminOnline ? "Admin online now" : "Admin offline, replies will still be saved"}
              </p>
            </div>
            <button className="text-sm font-semibold" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          {!profileReady && !socketRef.current ? (
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={validateProfile}
                maxLength={40}
              />
              <Input
                placeholder="10-digit Indian mobile number"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                onBlur={validateProfile}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
              />
              {profileError ? <p className="text-xs text-primary">{profileError}</p> : null}
              <Button onClick={startChat} disabled={connecting}>
                {connecting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start chat
              </Button>
              <p className="text-xs text-stone-500">Chat starts only after a valid name and 10-digit Indian number.</p>
            </div>
          ) : (
            <>
              {connectionError ? <p className="mt-4 text-xs text-primary">{connectionError}</p> : null}
              <div ref={scrollRef} className="mt-4 h-80 space-y-3 overflow-y-auto rounded-3xl bg-muted p-3">
                {messages.map((message) => {
                  const attachment = parseChatAttachment(message.message);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-fit max-w-[85%] flex-col",
                        message.senderType === "CUSTOMER"
                          ? "ml-auto text-right"
                          : "text-left"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm shadow-sm",
                          message.senderType === "CUSTOMER"
                            ? "bg-leaf text-white"
                            : "border border-border bg-white text-foreground"
                        )}
                      >
                        {attachment ? <AttachmentBubble attachment={attachment} /> : message.message}
                      </div>
                      <div className="mt-1 px-1 text-[11px] text-stone-500">
                        <span className="font-medium">{message.senderName}</span> · {formatChatTime(message.createdAt)}
                      </div>
                    </div>
                  );
                })}
                {typing ? <p className="text-xs text-stone-500">Admin is typing…</p> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Type your message"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    emitTyping();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!text.trim() || connecting}>
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {!open ? (
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_14px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_18px_45px_rgba(37,211,102,0.45)] sm:h-16 sm:w-16"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366]/30 opacity-40 animate-ping" />
          <svg viewBox="0 0 32 32" className="relative z-10 h-7 w-7 fill-current sm:h-8 sm:w-8" aria-hidden="true">
            <path d="M19.11 17.36c-.29-.14-1.69-.83-1.95-.92-.26-.09-.45-.14-.64.14-.19.28-.73.92-.89 1.11-.16.19-.32.21-.61.07-.29-.14-1.2-.44-2.28-1.41-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.12-.57.13-.13.29-.33.43-.5.14-.17.19-.28.29-.47.09-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.56-.46-.48-.64-.49h-.54c-.19 0-.5.07-.76.35-.26.28-1 1-.98 2.43.02 1.43 1.03 2.81 1.17 3 .14.19 2.02 3.09 4.89 4.33.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.69-.69 1.93-1.36.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.55-.33Z" />
            <path d="M27.26 4.73A15.84 15.84 0 0 0 16.01 0C7.17 0 0 7.17 0 16c0 2.82.74 5.58 2.14 8.02L0 32l8.19-2.1A15.94 15.94 0 0 0 16.01 32C24.83 32 32 24.83 32 16c0-4.27-1.66-8.28-4.74-11.27ZM16.01 29.3c-2.41 0-4.77-.65-6.83-1.88l-.49-.29-4.86 1.25 1.29-4.74-.32-.49A13.27 13.27 0 0 1 2.72 16c0-7.31 5.96-13.27 13.29-13.27 3.55 0 6.88 1.38 9.39 3.88A13.18 13.18 0 0 1 29.3 16c0 7.31-5.96 13.3-13.29 13.3Z" />
          </svg>
          <span className="pointer-events-none absolute right-full mr-3 hidden translate-x-2 whitespace-nowrap rounded-full border border-[#eadfd3] bg-white/95 px-4 py-2 text-sm font-semibold text-stone-800 opacity-0 shadow-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block">
            Order on WhatsApp
          </span>
        </motion.a>
      ) : null}

      <button
        type="button"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl sm:h-16 sm:w-16"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
