"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget), {
  ssr: false
});

export function ChatWidgetLazy() {
  return <ChatWidget />;
}
