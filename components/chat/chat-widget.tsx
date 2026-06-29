"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MessageCircle, SendHorizontal } from "lucide-react";
import { publicEnv } from "@/lib/public-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatChatTime, isLikelyHumanName, isValidIndianMobile, normalizeIndianMobile, sanitizeHumanName } from "@/lib/chat";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
  clientId?: string;
};

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

    window.addEventListener("saswatis:open-chat", handleOpenChat);
    return () => window.removeEventListener("saswatis:open-chat", handleOpenChat);
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

  return (
    <div className="fixed bottom-5 right-5 z-40">
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
                {messages.map((message) => (
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
                      {message.message}
                    </div>
                    <div className="mt-1 px-1 text-[11px] text-stone-500">
                      <span className="font-medium">{message.senderName}</span> · {formatChatTime(message.createdAt)}
                    </div>
                  </div>
                ))}
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

      <button
        className="ml-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
