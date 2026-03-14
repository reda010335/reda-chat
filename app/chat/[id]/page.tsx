"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

export default function DirectChatPage() {
  const { id: receiverId } = useParams();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [me, setMe] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user);

      // جلب الرسائل القديمة بيني وبين الشخص ده
      const { data } = await supabase
        .from("Message")
        .select("*")
        .or(`and(senderId.eq.${user?.id},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${user?.id})`)
        .order("createdAt", { ascending: true });
      setMessages(data || []);
    };
    initChat();

    // السحر هنا: الاشتراك في الرسائل الجديدة "Real-time"
    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [receiverId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from("Message").insert([
      { content: newMessage, senderId: me.id, receiverId: receiverId }
    ]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      <header className="p-4 bg-white border-b font-bold shadow-sm">دردشة مباشرة</header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.senderId === me?.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderId === me?.id ? "bg-emerald-500 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="اكتب رسالتك..." 
          className="flex-1 bg-slate-100 p-3 rounded-xl outline-none text-sm"
        />
        <button onClick={sendMessage} className="bg-emerald-600 text-white px-5 rounded-xl font-bold">إرسال</button>
      </div>
    </div>
  );
}