"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { publicEnv } from "@/lib/public-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Thread = {
  id: string;
  customerName: string;
  phone: string;
  orderId?: string | null;
  unreadCount?: number;
  messages?: Array<{ id: string; senderType: "CUSTOMER" | "ADMIN"; message: string }>;
};

export function AdminChatPanel() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(publicEnv.chatServerUrl, {
      transports: ["websocket"],
      auth: { role: "admin", adminId: "primary-admin" }
    });

    socket.on("admin:threads", (nextThreads: Thread[]) => setThreads(nextThreads));
    socket.on("admin:thread", (thread: Thread) => setActiveThread(thread));
    socket.on("chat:message", (message: { chatId: string; id: string; senderType: "CUSTOMER" | "ADMIN"; message: string }) => {
      setThreads((current) =>
        current.map((thread) =>
          thread.id === message.chatId
            ? {
                ...thread,
                messages: [...(thread.messages ?? []), message]
              }
            : thread
        )
      );
      setActiveThread((current) =>
        current?.id === message.chatId
          ? {
              ...current,
              messages: [...(current.messages ?? []), message]
            }
          : current
      );
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  function openThread(threadId: string) {
    socketRef.current?.emit("admin:open-thread", { chatId: threadId });
  }

  function sendMessage() {
    if (!text.trim() || !activeThread) return;
    socketRef.current?.emit("chat:message", {
      chatId: activeThread.id,
      message: text.trim()
    });
    setText("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <Card className="p-4">
        <p className="font-serif text-2xl">Conversations</p>
        <div className="mt-4 space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left"
              onClick={() => openThread(thread.id)}
            >
              <p className="font-semibold">{thread.customerName}</p>
              <p className="text-xs text-stone-500">{thread.phone}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <p className="font-serif text-2xl">{activeThread?.customerName ?? "Select a thread"}</p>
        <div className="mt-4 h-[520px] space-y-3 overflow-y-auto rounded-3xl bg-muted p-4">
          {activeThread?.messages?.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                message.senderType === "ADMIN" ? "ml-auto bg-primary text-white" : "bg-white"
              }`}
            >
              {message.message}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Reply to customer"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (activeThread) {
                socketRef.current?.emit("chat:typing", {
                  typing: true,
                  chatId: activeThread.id
                });
              }
            }}
          />
          <Button onClick={sendMessage}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
