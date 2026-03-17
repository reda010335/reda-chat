"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };
type Message = { 
  id: string; 
  content: string; 
  senderId: string; 
  receiverId: string; 
  type?: string; 
  mediaUrl?: string; 
  callId?: string; 
  createdAt: string; 
};

export default function ChatPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const { id: receiverIdParam } = useParams();
  const receiverId = Array.isArray(receiverIdParam) ? receiverIdParam[0] : receiverIdParam;

  const [me, setMe] = useState<User | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // جلب بيانات المستخدمين والرسائل
  useEffect(() => {
    if (!receiverId) return;

    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push("/login");

      const { data: myData } = await supabase.from("User").select("*").eq("id", authUser.id).single();
      setMe(myData as User);

      const { data: rec } = await supabase.from("User").select("*").eq("id", receiverId).maybeSingle();
      setReceiver(rec as User | null);

      const res = await fetch("/api/messages/get", { 
        method: "POST", 
        body: JSON.stringify({ userId: authUser.id, friendId: receiverId }) 
      });
      const msgs: Message[] = await res.json();
      setMessages(msgs);
    };

    init();
  }, [receiverId, router, supabase]);

  // استقبال الرسائل realtime
  useEffect(() => {
    if (!me || !receiverId) return;

    const channel = supabase
      .channel(`chat_${receiverId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, (payload: any) => {
        const msg = payload.new as Message;
        if ((msg.senderId === me.id && msg.receiverId === receiverId) || 
            (msg.senderId === receiverId && msg.receiverId === me.id)) {
          setMessages(prev => [...prev, msg]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me, receiverId, supabase]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!me || !receiverId || !newMessage.trim()) return;

    const text = newMessage;
    setNewMessage("");

    await fetch("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({
        senderId: me.id,
        receiverId,
        text
      })
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      <header className="bg-white dark:bg-slate-900 p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${receiverId}`)}>
          <img src={receiver?.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-white">{receiver?.profileName}</span>
            <span className="text-[12px] text-emerald-500">Online 🔴🟢</span>
          </div>
        </div>
        <button onClick={() => router.back()} className="text-xl">🔙</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === me?.id;
          return (
            <div key={msg.id || index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 px-4 rounded-[18px] text-sm ${isMine ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border dark:border-slate-800"}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white p-2 px-4 rounded-full outline-none text-sm"
        />
        <button onClick={sendMessage} className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform">
          📩
        </button>
      </div>
    </div>
  );
}