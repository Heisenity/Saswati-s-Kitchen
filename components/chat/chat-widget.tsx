"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { FileText, LoaderCircle, MessageCircle, Paperclip, SendHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatChatTime,
  isLikelyHumanName,
  isValidIndianMobile,
  normalizeIndianMobile,
  parseChatAttachment,
  serializeChatAttachment,
  sanitizeHumanName,
  type ChatAttachment
} from "@/lib/chat";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Message = {
  id: string;
  chatId: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderName: string;
  message: string;
  createdAt: string;
  clientId?: string;
};

function dedupeMessages(nextMessages: Message[]) {
  return nextMessages.filter(
    (message, index, current) =>
      current.findIndex((entry) => entry.id === message.id) === index
  );
}

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

function mergeMessage(current: Message[], nextMessage: Message) {
  const optimisticIndex = nextMessage.clientId
    ? current.findIndex((entry) => entry.id === nextMessage.clientId)
    : -1;

  if (optimisticIndex >= 0) {
    return current.map((entry, index) => (index === optimisticIndex ? nextMessage : entry));
  }

  if (current.some((entry) => entry.id === nextMessage.id)) {
    return current;
  }

  return [...current, nextMessage];
}

function getChatStorageKey(userId?: string | null) {
  return `saswatis-kitchen-chat:${userId ?? "guest"}`;
}

function getChatAccountName(user: User | null) {
  if (!user) return "";

  const candidates = [
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "",
    typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : ""
  ];

  return sanitizeHumanName(candidates.find(Boolean) ?? "");
}

export function ChatWidget() {
  const supabase = useRef(createClient()).current;
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identityRef = useRef<string>("");
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [storageKey, setStorageKey] = useState(getChatStorageKey());
  const [nameLocked, setNameLocked] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
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
    let active = true;

    async function syncIdentity() {
      setProfileLoading(true);
      try {
        const [{ data }, profileResponse] = await Promise.all([
          supabase.auth.getUser(),
          fetch("/api/chat/session", { cache: "no-store" }).catch(() => null)
        ]);
        const user = data.user;

        if (!active) return;

        const nextIdentity = user?.id ?? "guest";
        const nextStorageKey = getChatStorageKey(user?.id);
        const storedName = window.localStorage.getItem(`${nextStorageKey}:name`) ?? "";
        const storedPhone = window.localStorage.getItem(`${nextStorageKey}:phone`) ?? "";
        const identityChanged = identityRef.current !== nextIdentity;
        const identity =
          profileResponse && profileResponse.ok
            ? ((await profileResponse.json()) as {
                ok?: boolean;
                customerName?: string;
                phone?: string;
                nameLocked?: boolean;
                phoneLocked?: boolean;
              })
            : null;
        const accountName =
          sanitizeHumanName(identity?.customerName ?? "") || getChatAccountName(user);
        const nextPhone = normalizeIndianMobile(identity?.phone ?? "") || storedPhone;

        setStorageKey(nextStorageKey);

        if (isLikelyHumanName(accountName) || identity?.nameLocked) {
          setNameLocked(Boolean(identity?.nameLocked || accountName));
          setName((current) => (identityChanged || !current ? accountName : current));
        } else {
          setNameLocked(false);
          if (identityChanged) setName(storedName);
        }

        setPhoneLocked(Boolean(identity?.phoneLocked && isValidIndianMobile(nextPhone)));

        if (identityChanged) {
          identityRef.current = nextIdentity;
          setPhone(nextPhone);
          setChatId(null);
          setMessages([]);
          setText("");
          setConnectionError("");
          setProfileError("");
          setUnreadCount(0);
        } else if (nextPhone) {
          setPhone((current) => current || nextPhone);
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void syncIdentity();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void syncIdentity();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!chatId) {
      setUnreadCount(0);
      return;
    }

    const readKey = `${storageKey}:last-read:${chatId}`;
    const adminMessages = messages.filter((message) => message.senderType === "ADMIN");
    const latestAdminMessage = adminMessages.at(-1);

    if (open) {
      if (latestAdminMessage?.createdAt) {
        window.localStorage.setItem(readKey, latestAdminMessage.createdAt);
      }
      setUnreadCount(0);
      return;
    }

    const lastReadAt = window.localStorage.getItem(readKey);
    if (!lastReadAt) {
      setUnreadCount(adminMessages.length);
      return;
    }

    const lastReadTime = new Date(lastReadAt).getTime();
    setUnreadCount(
      adminMessages.filter((message) => new Date(message.createdAt).getTime() > lastReadTime).length
    );
  }, [chatId, messages, open, storageKey]);

  useEffect(() => {
    if (!open || chatId || !profileReady) return;

    setConnecting(true);
    setConnectionError("");

    fetch("/api/chat/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerName: safeName,
        phone: safePhone,
        orderNumber: window.localStorage.getItem("saswatis-kitchen-last-order") ?? undefined
      })
    })
      .then((response) => response.json())
      .then((result) => {
        if (!result.ok) {
          throw new Error(result.error ?? "Could not start chat right now.");
        }

        setChatId(result.chatId);
        setMessages(dedupeMessages(result.messages ?? []));
        setAdminOnline(Boolean(result.adminOnline));
        setName(result.customerName ?? safeName);
        setPhone(result.phone ?? safePhone);
        setNameLocked(Boolean(result.nameLocked));
        setPhoneLocked(Boolean(result.phoneLocked));
        if (!nameLocked) {
          window.localStorage.setItem(`${storageKey}:name`, result.customerName ?? safeName);
        }
        window.localStorage.setItem(`${storageKey}:phone`, result.phone ?? safePhone);
        setConnecting(false);
      })
      .catch(() => {
        setConnecting(false);
        setConnectionError("Could not connect to chat right now. Please try again.");
      });
  }, [chatId, nameLocked, open, profileReady, safeName, safePhone, sessionAttempt, storageKey]);

  useEffect(() => {
    if (!chatId) return;

    const payload = JSON.stringify({ chatId, online: true });
    void fetch("/api/chat/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });

    const intervalId = setInterval(() => {
      void fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
    }, 30_000);

    return () => {
      clearInterval(intervalId);
      void fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, online: false }),
        keepalive: true
      });
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const roomChannel = supabase
      .channel(`chat:${chatId}`, {
        config: { broadcast: { self: true, ack: true } }
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((current) => dedupeMessages(mergeMessage(current, payload as Message)));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const next = payload as { typing?: boolean; senderType?: "CUSTOMER" | "ADMIN" };
        if (next.senderType === "ADMIN") {
          setTyping(Boolean(next.typing));
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setConnectionError("Could not connect to chat right now. Please try again.");
        }
      });

    const presenceChannel = supabase
      .channel("chat-admin-presence")
      .on("broadcast", { event: "status" }, ({ payload }) => {
        setAdminOnline(Boolean((payload as { online?: boolean })?.online));
      })
      .subscribe();

    roomChannelRef.current = roomChannel;
    presenceChannelRef.current = presenceChannel;

    return () => {
      if (roomChannelRef.current) {
        void supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
      if (presenceChannelRef.current) {
        void supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [chatId, supabase]);

  function validateProfile() {
    const nextName = sanitizeHumanName(name);
    const nextPhone = normalizeIndianMobile(phone);

    if (!isLikelyHumanName(nextName)) {
      setProfileError("Enter a real name using letters only, for example Sayantan or Saswati Sen.");
      return false;
    }

    if (!isValidIndianMobile(nextPhone)) {
      setProfileError("Enter a valid Indian mobile number with exactly 10 digits.");
      return false;
    }

    setProfileError("");
    setName(nextName);
    setPhone(nextPhone);
    return true;
  }

  function startChat() {
    validateProfile();
  }

  function emitTyping() {
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        typing: true,
        senderType: "CUSTOMER"
      }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      roomChannelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: {
          typing: false,
          senderType: "CUSTOMER"
        }
      });
    }, 900);
  }

  function sendMessage(rawText = text) {
    const messageText = rawText.trim();
    if (!messageText || !chatId) return;

    const clientId = crypto.randomUUID();
    const optimistic = {
      id: clientId,
      chatId,
      senderType: "CUSTOMER" as const,
      senderName: sanitizeHumanName(name) || "You",
      message: messageText,
      createdAt: new Date().toISOString(),
      clientId
    };

    setMessages((current) => [...current, optimistic]);
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        typing: false,
        senderType: "CUSTOMER"
      }
    });

    setText("");

    fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chatId,
        customerName: sanitizeHumanName(name),
        phone: normalizeIndianMobile(phone),
        message: messageText,
        clientId
      })
    })
      .then((response) => response.json())
      .then((result) => {
        if (!result.ok || !result.message) {
          throw new Error(result.error ?? "Could not send message right now.");
        }

        setMessages((current) => dedupeMessages(mergeMessage(current, result.message as Message)));
      })
      .catch(() => {
        setMessages((current) => current.filter((entry) => entry.id !== clientId));
        setConnectionError("Could not send message right now. Please try again.");
      });
  }

  async function uploadAttachment(file: File) {
    if (!chatId) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
    if (!allowedTypes.has(file.type)) {
      setConnectionError("Only JPG, PNG, or PDF files can be sent.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setConnectionError("Attachment must be 2MB or smaller.");
      return;
    }

    setUploadingAttachment(true);
    setConnectionError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/chat/attachment", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as {
        ok: boolean;
        url?: string;
        name?: string;
        mimeType?: string;
        error?: string;
      };

      if (!result.ok || !result.url || !result.name || !result.mimeType) {
        throw new Error(result.error ?? "Could not upload the attachment.");
      }

      sendMessage(
        serializeChatAttachment({
          url: result.url,
          name: result.name,
          mimeType: result.mimeType
        })
      );
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "Could not upload the attachment."
      );
    } finally {
      setUploadingAttachment(false);
    }
  }

  const whatsappUrl = buildWhatsAppUrl(
    "Hi Saswati’s Kitchen, I want to know today’s menu and delivery availability."
  );

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[80] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:gap-4">
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

          {profileLoading && !chatId ? (
            <div className="mt-6 flex items-center gap-3 rounded-3xl bg-muted px-4 py-4 text-sm text-stone-600">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading your chat profile…
            </div>
          ) : !profileReady && !chatId ? (
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={validateProfile}
                maxLength={40}
                disabled={nameLocked}
              />
              <Input
                placeholder="10-digit Indian mobile number"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                onBlur={validateProfile}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                disabled={phoneLocked}
              />
              {profileError ? <p className="text-xs text-primary">{profileError}</p> : null}
              <Button onClick={startChat} disabled={connecting}>
                {connecting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start chat
              </Button>
              <p className="text-xs text-stone-500">
                {nameLocked
                  ? phoneLocked
                    ? "Your signed-in account name and phone are being used for this chat."
                    : "Your signed-in account name is being used for this chat."
                  : "Chat starts only after a valid name and 10-digit Indian number."}
              </p>
            </div>
          ) : !chatId ? (
            connectionError ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 text-xs text-primary">
                  {connectionError}
                </p>
                <Button
                  onClick={() => {
                    setConnectionError("");
                    setSessionAttempt((current) => current + 1);
                  }}
                >
                  Retry chat
                </Button>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-3 rounded-3xl bg-muted px-4 py-4 text-sm text-stone-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Opening your conversation…
              </div>
            )
          ) : (
            <>
              {connectionError ? <p className="mt-4 text-xs text-primary">{connectionError}</p> : null}
              <div
                ref={scrollRef}
                className="mt-4 h-80 space-y-3 overflow-y-auto rounded-3xl bg-muted p-3"
              >
                {messages.map((message, index) => {
                  const attachment = parseChatAttachment(message.message);

                  return (
                    <div
                      key={`${message.id}-${index}`}
                      className={cn(
                        "flex w-fit max-w-[85%] flex-col",
                        message.senderType === "CUSTOMER" ? "ml-auto text-right" : "text-left"
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
                        <span className="font-medium">{message.senderName}</span> ·{" "}
                        {formatChatTime(message.createdAt)}
                      </div>
                    </div>
                  );
                })}
                {typing ? <p className="text-xs text-stone-500">Admin is typing…</p> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachment || connecting || !chatId}
                  aria-label="Upload attachment"
                >
                  {uploadingAttachment ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>
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
                <Button onClick={() => sendMessage()} disabled={!text.trim() || connecting || !chatId}>
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
          className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_14px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_18px_45px_rgba(37,211,102,0.45)] sm:h-16 sm:w-16"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/30 opacity-40" />
          <svg
            viewBox="0 0 32 32"
            className="relative z-10 h-7 w-7 fill-current sm:h-8 sm:w-8"
            aria-hidden="true"
          >
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
        className="relative ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl sm:h-16 sm:w-16"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
        {!open && unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-mustard px-1 text-[11px] font-bold text-stone-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
