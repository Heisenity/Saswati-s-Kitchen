"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, SendHorizontal } from "lucide-react";
import { publicEnv } from "@/lib/public-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  message: string;
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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!open || socketRef.current || !name || !phone) return;

    const socket = io(publicEnv.chatServerUrl, {
      transports: ["websocket"],
      auth: {
        role: "customer",
        customerName: name,
        phone,
        orderNumber: window.localStorage.getItem("saswatis-kitchen-last-order") ?? undefined
      }
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
    socket.on("chat:typing", (value: boolean) => setTyping(value));
    socket.on("admin:status", (value: boolean) => setAdminOnline(value));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, name, phone]);

  function sendMessage() {
    if (!text.trim() || !socketRef.current) return;

    const clientId = crypto.randomUUID();
    const optimistic = {
      id: clientId,
      senderType: "CUSTOMER" as const,
      message: text.trim(),
      clientId
    };
    setMessages((current) => [...current, optimistic]);
    socketRef.current.emit("chat:message", { message: text.trim(), clientId });
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

          {!name || !phone ? (
            <div className="mt-4 space-y-3">
              <Input placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <p className="text-xs text-stone-500">Start chat after entering name and phone.</p>
            </div>
          ) : (
            <>
              <div className="mt-4 h-72 space-y-3 overflow-y-auto rounded-3xl bg-muted p-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.senderType === "CUSTOMER"
                        ? "ml-auto bg-primary text-white"
                        : "bg-white text-foreground"
                    }`}
                  >
                    {message.message}
                  </div>
                ))}
                {typing ? <p className="text-xs text-stone-500">Saswati’s Kitchen is typing…</p> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Type your message"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    socketRef.current?.emit("chat:typing", { typing: true });
                  }}
                />
                <Button onClick={sendMessage}>
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
