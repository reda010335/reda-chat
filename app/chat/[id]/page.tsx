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
  const { id: receiverId } = useParams();

  const [me, setMe] = useState<User | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // جلب بيانات المستخدمين والرسائل
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");
      setMe({
        id: user.id,
        profileName: (user as any).profileName || "",
        username: (user as any).username || "",
        image: (user as any).image || "",
      });

      // جلب بيانات المستقبل
      const { data: rec } = await supabase
        .from("User")
        .select("*")
        .eq("id", receiverId)
        .maybeSingle();
      setReceiver(rec);

      // جلب الرسائل السابقة
      const { data: oldMessages } = await supabase
        .from("Message")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
        )
        .order("createdAt", { ascending: true });
      setMessages(oldMessages || []);
    };
    init();
  }, [receiverId]);

  // الاشتراك في Realtime لتحديث الرسائل مباشرة
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`chat_${receiverId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "Message",
      }, (payload) => {
        const msg: Message = payload.new;
        if (
          (msg.sender_id === me.id && msg.receiver_id === receiverId) ||
          (msg.sender_id === receiverId && msg.receiver_id === me.id)
        ) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [receiverId, me]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // إرسال رسالة
  const sendMessage = async () => {
    if (!newMessage.trim() || !me) return;

    const msgContent = newMessage;
    setNewMessage("");

    // عرض الرسالة فوراً قبل إرسالها
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), content: msgContent, sender_id: me.id, receiver_id: receiverId!, createdAt: new Date().toISOString() }
    ]);

    const { error } = await supabase.from("Message").insert([
      { content: msgContent, sender_id: me.id, receiver_id: receiverId }
    ]);

    if (error) console.error("فشل الإرسال:", error.message);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 cursor-pointer"
               onClick={() => router.push(`/profile/${receiverId}`)}>
            {receiver?.image 
              ? <img src={receiver.image} className="w-full h-full object-cover" /> 
              : <span className="flex items-center justify-center w-full h-full bg-emerald-500 text-white font-bold">{receiver?.profileName?.[0]}</span>
            }
          </div>
          <div className="flex flex-col cursor-pointer" onClick={() => router.push(`/chat/${receiverId}`)}>
            <h2 className="font-black text-slate-800 dark:text-white">{receiver?.profileName || "جاري التحميل..."}</h2>
            <p className="text-[10px] text-emerald-500 font-bold">{receiver ? "متصل الآن" : "..."}</p>
            <span className="text-[11px] text-slate-400">@{receiver?.username || ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 text-xl">⬅️</button>
          <button className="text-slate-400 text-2xl">⋮</button>
        </div>
      </header>

      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === me?.id;
          return (
            <div key={msg.id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 px-4 rounded-[22px] text-[15px] shadow-sm ${isMine ? "bg-emerald-600 text-white rounded-br-none" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border dark:border-slate-800"}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[28px]">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-transparent p-2 px-4 outline-none text-[15px] dark:text-white"
          />
          <button onClick={sendMessage} className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all">📩</button>
        </div>
      </div>
    </div>
  );
}