"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

type User = {
  id: string;
  profileName: string;
  username: string;
  image?: string;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  createdAt: string;
};

export default function ChatPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const { id } = useParams();
  const receiverId = id as string;

  const [me, setMe] = useState<User | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ تحميل البيانات
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/signup");

      const myId = session.user.id;

      const { data: meData } = await supabase
        .from("User")
        .select("*")
        .eq("id", myId)
        .single();

      const { data: recData } = await supabase
        .from("User")
        .select("*")
        .eq("id", receiverId)
        .single();

      setMe(meData);
      setReceiver(recData);

      const { data: msgs } = await supabase
        .from("Message")
        .select("*")
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${myId})`
        )
        .order("createdAt", { ascending: true });

      setMessages(msgs || []);
    };

    init();
  }, [receiverId]);

  // ✅ realtime بدون ريفريش
  useEffect(() => {
    if (!me) return;

    const channel = supabase
      .channel(`chat_${me.id}_${receiverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
        },
        (payload) => {
          const msg = payload.new as Message;

          const isBetweenUs =
            (msg.sender_id === me.id && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === me.id);

          if (isBetweenUs) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, receiverId]);

  // ✅ scroll auto
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ ارسال رسالة (فوري)
  const sendMessage = async () => {
    if (!newMessage.trim() || !me) return;

    const temp = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender_id: me.id,
      receiver_id: receiverId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);
    setNewMessage("");

    await supabase.from("Message").insert([
      {
        content: temp.content,
        sender_id: temp.sender_id,
        receiver_id: temp.receiver_id,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950" dir="rtl">
      
      {/* 🔥 HEADER */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b">
        
        <div
          onClick={() => router.push(`/profile/${receiver?.id}`)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={receiver?.image || "/user.png"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-bold text-slate-800 dark:text-white">
              {receiver?.profileName}
            </div>
            <div className="text-xs text-green-500">متصل الآن</div>
          </div>
        </div>

        <div className="flex gap-3 text-xl">
          <button>⋮</button>
          <button onClick={() => router.back()}>⬅️</button>
        </div>
      </div>

      {/* 💬 الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === me?.id
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm ${
                msg.sender_id === me?.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* ✍️ input */}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-slate-100 px-4 py-2 rounded-full outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-emerald-600 text-white px-4 rounded-full"
        >
          ➤
        </button>
      </div>
    </div>
  );
}