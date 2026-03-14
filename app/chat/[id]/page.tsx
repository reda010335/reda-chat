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
  const { id: receiverId } = useParams();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myUser, setMyUser] = useState<any>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      // 1. جلب بيانات المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyUser(user);

      // 2. جلب بيانات الشخص اللي بتكلمه
      const { data: receiverData } = await supabase
        .from("User")
        .select("*")
        .eq("id", receiverId)
        .maybeSingle();
      setReceiver(receiverData);

      // 3. جلب الرسائل القديمة (بناءً على الأسماء الجديدة في الـ SQL)
      if (user) {
        const { data: oldMessages } = await supabase
          .from("Message")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
          .order("createdAt", { ascending: true });
        setMessages(oldMessages || []);
      }
    };

    initChat();

    // 4. الاشتراك في Realtime لظهور الرسائل فوراً
    const channel = supabase
      .channel(`chat_${receiverId}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "Message" 
      }, (payload) => {
        const msg = payload.new;
        // تأكد أن الرسالة تخص هذه المحادثة تحديداً
        setMessages((prev) => {
          // منع تكرار الرسالة إذا كانت هي اللي لسه مبعوتة
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [receiverId]);

  // تمرير الشاشة لآخر رسالة تلقائياً
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !myUser) return;
    
    const msgContent = newMessage;
    setNewMessage(""); // مسح الخانة فوراً لتجربة مستخدم سريعة

    // الإرسال لقاعدة البيانات بالأسماء اللي صلحناها في الـ SQL
    const { error } = await supabase.from("Message").insert([
      { 
        content: msgContent, 
        sender_id: myUser.id, 
        receiver_id: receiverId 
      }
    ]);

    if (error) {
      console.error(error);
      alert("فشل الإرسال: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden" dir="rtl">
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${receiverId}`)}>
          <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-700 shadow-md overflow-hidden">
            {receiver?.image ? <img src={receiver.image} className="w-full h-full object-cover" /> : <span>{receiver?.profileName?.[0] || "?"}</span>}
          </div>
          <div className="flex flex-col">
            <h2 className="font-black text-slate-800 dark:text-white text-[14px]">
              {receiver?.profileName || "جاري التحميل..."}
            </h2>
            <p className="text-[10px] text-emerald-500 font-bold">متصل الآن</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="text-slate-400">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === myUser?.id;
          return (
            <div key={msg.id || idx} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] p-3 px-4 rounded-[22px] text-[15px] shadow-sm ${
                isMine 
                  ? "bg-emerald-600 text-white rounded-br-none" 
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border dark:border-slate-800"
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[28px]">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-transparent p-2 px-4 outline-none text-[15px] dark:text-white"
          />
          <button onClick={sendMessage} className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}