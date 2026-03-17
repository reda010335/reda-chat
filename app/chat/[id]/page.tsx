"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type User = {
  id: string;
  profileName: string;
  username: string;
  image?: string | null;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  type?: string | null;
  mediaUrl?: string | null;
  callId?: string | null;
  createdAt: string;
};

export default function ChatPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const { id: receiverIdParam } = useParams();
  const receiverId = Array.isArray(receiverIdParam)
    ? receiverIdParam[0]
    : receiverIdParam;

  const [me, setMe] = useState<User | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/signup");
        return;
      }

      const [{ data: myData }, { data: receiverData }] = await Promise.all([
        supabase
          .from("User")
          .select("id, profileName, username, image")
          .eq("id", authUser.id)
          .single(),
        supabase
          .from("User")
          .select("id, profileName, username, image")
          .eq("id", receiverId)
          .maybeSingle(),
      ]);

      const res = await fetch(
        `/api/messages?userId=${authUser.id}&receiverId=${receiverId}`
      );
      const msgs = res.ok ? ((await res.json()) as Message[]) : [];

      if (isMounted) {
        setMe((myData as User) || null);
        setReceiver((receiverData as User) || null);
        setMessages(msgs);
      }
    };

    if (receiverId) {
      init();
    }

    return () => {
      isMounted = false;
    };
  }, [receiverId, router, supabase]);

  useEffect(() => {
    if (!me || !receiverId) {
      return;
    }

    const channel = supabase
      .channel(`chat:${me.id}:${receiverId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload: { new: Message }) => {
          const msg = payload.new;
          const isCurrentChat =
            (msg.senderId === me.id && msg.receiverId === receiverId) ||
            (msg.senderId === receiverId && msg.receiverId === me.id);

          if (!isCurrentChat) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((entry) => entry.id === msg.id)) {
              return prev;
            }

            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, receiverId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = newMessage.trim();

    if (!content || !me || !receiverId) {
      return;
    }

    setNewMessage("");

    const tempMessage: Message = {
      id: crypto.randomUUID(),
      content,
      senderId: me.id,
      receiverId,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId: me.id,
        receiverId,
        text: content,
      }),
    });

    if (!res.ok) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      console.error("Failed to send message");
      return;
    }

    const savedMessage = (await res.json()) as Message;
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempMessage.id ? savedMessage : msg))
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden" dir="rtl">
      <header className="border-b border-white/60 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            type="button"
          >
            Back
          </button>

          <button
            onClick={() => router.push(`/profile/${receiverId}`)}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            type="button"
          >
            <img
              src={receiver?.image || "/user.png"}
              alt={receiver?.profileName || "User"}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="text-right">
              <h1 className="font-bold text-slate-900 dark:text-white">
                {receiver?.profileName || "User"}
              </h1>
              <p className="text-xs text-emerald-600">
                @{receiver?.username || "chat"}
              </p>
            </div>
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.senderId === me?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm leading-7 shadow-sm ${
                      isMine
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : "rounded-bl-md border border-white/70 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="border-t border-white/60 bg-white/85 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
          <div className="mx-auto flex max-w-3xl gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Write a message..."
              className="flex-1 rounded-full bg-slate-100 px-5 py-3 text-sm outline-none transition focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            />
            <button
              onClick={sendMessage}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              type="button"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
