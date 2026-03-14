"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

export default function ChatPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const { id: receiverId } = useParams(); // ID الشخص اللي بتكلمه
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myUser, setMyUser] = useState<any>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      // 1. نجيب بياناتي
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyUser(user);

      // 2. نجيب بيانات الشخص اللي بكلمه (عشان الاسم والصورة يظهروا فوق)
      const { data: receiverData } = await supabase
        .from("User")
        .select("*")
        .eq("id", receiverId)
        .single();
      setReceiver(receiverData);

      // 3. نجيب الرسائل القديمة بيننا
      if (user) {
        const { data: oldMessages } = await supabase
          .from("Message")
          .select("*")
          .or(`and(senderId.eq.${user.id},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${user.id})`)
          .order("createdAt", { ascending: true });
        setMessages(oldMessages || []);
      }
    };

    initChat();

    // 4. ميزة الـ Real-time (الرسائل تظهر فوراً أول ما توصل)
    const channel = supabase
      .channel("chat_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, (payload) => {
        const msg = payload.new;
        if ((msg.senderId === myUser?.id && msg.receiverId === receiverId) || 
            (msg.senderId === receiverId && msg.receiverId === myUser?.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [receiverId, myUser?.id]);

  // سكرول تلقائي لآخر رسالة
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !myUser) return;
    const msgContent = newMessage;
    setNewMessage("");

    const { error } = await supabase.from("Message").insert([
      { content: msgContent, senderId: myUser.id, receiverId: receiverId }
    ]);

    if (error) alert("فشل الإرسال: تأكد من جدول Message في سوبابيز");
  };

  if (!receiver) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-600 animate-pulse">جاري تحميل الدردشة...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      {/* الهيدر - فيه الاسم وزر الرجوع */}
      <header className="bg-white p-4 flex items-center gap-4 border-b shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-2xl text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-all">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden border border-emerald-100 shadow-sm">
          {receiver.image ? <img src={receiver.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{receiver.profileName[0]}</div>}
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-sm leading-tight">{receiver.profileName}</h2>
          <p className="text-[10px] text-emerald-500 font-bold">متصل الآن</p>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.senderId === myUser?.id ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] p-3 px-4 rounded-[22px] text-sm font-medium shadow-sm ${
              msg.senderId === myUser?.id 
                ? "bg-emerald-600 text-white rounded-br-none" 
                : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* منطقة الكتابة */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-transparent p-2 px-4 outline-none text-sm"
          />
          <button onClick={sendMessage} className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 active:scale-90 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}