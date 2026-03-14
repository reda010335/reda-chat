"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  id: string;
  content: string; 
  createdAt: string;
  senderId: string;
  receiverId: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const receiverId = String(params.id); // الـ ID بتاع الشخص التاني
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. جلب المستخدم الحالي
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
      else router.push("/login");
    };
    getUser();
  }, [supabase.auth]);

  // 2. تحميل الرسائل والاشتراك في Realtime
  useEffect(() => {
    if (!currentUser?.id || !receiverId) return;

    loadMessages();

    // إعداد الـ Realtime - لاحظ اسم الجدول Message بالمفرد
    const channel = supabase
      .channel(`chat:${receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message', // مفرد حسب السكيما
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          // نأكد إن الرسالة تخص المحادثة دي بس (بيني وبين الشخص ده)
          const isRelated = 
            (newMessage.senderId === currentUser.id && newMessage.receiverId === receiverId) ||
            (newMessage.senderId === receiverId && newMessage.receiverId === currentUser.id);

          if (isRelated) {
            setMessages((prev) => {
              if (prev.find(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, receiverId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    try {
      // بننادي الـ API اللي عملناه بـ userId و receiverId
      const res = await fetch(`/api/messages?userId=${currentUser.id}&receiverId=${receiverId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.log("loadMessages error:", error);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !currentUser?.id || sending) return;

    try {
      setSending(true);
      const currentText = text.trim();
      setText(""); 

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: receiverId, // مهم جداً
          text: currentText,      // الحقل اسمه text في الـ API بتاعنا
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      
    } catch (error) {
      console.log("sendMessage error:", error);
      setText(text); 
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#efeae2] flex justify-center font-sans" dir="rtl">
      <div className="flex h-screen w-full max-w-md flex-col bg-[#efeae2] shadow-xl relative border-x border-slate-200">
        
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/chat")} className="text-xl text-slate-600">➡️</button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-lg">
              {receiverId.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">محادثة مباشرة</h1>
              <p className="text-[10px] text-emerald-600 font-medium">نشط الآن</p>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm relative ${
                  isMe ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"
                }`}>
                  <p className="text-[14px] leading-relaxed break-words text-slate-800">{msg.content}</p>
                  <span className="text-[9px] text-slate-400 block mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#f0f0f0] flex items-center gap-2 border-t border-slate-200 pb-8">
           <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب رسالة..."
              className="flex-1 rounded-full py-2 px-5 outline-none text-right text-slate-800 shadow-sm focus:ring-1 focus:ring-emerald-500"
           />
           <button 
             onClick={sendMessage}
             disabled={!text.trim() || sending}
             className="bg-emerald-600 text-white h-10 w-10 flex items-center justify-center rounded-full shadow-md active:scale-90 transition-transform"
           >
             {sending ? ".." : "➤"}
           </button>
        </div>
      </div>
    </div>
  );
}
