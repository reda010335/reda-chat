"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// تعريف نوع البيانات عشان الـ TypeScript ميزعلش
interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

export default function ChatRoom() {
  const { id: receiverId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]); // حل مشكلة never
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // سحب الرسايل وبيانات المستخدم
  useEffect(() => {
    const initChat = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.push("/login");
      setUser(data.user);

      const res = await fetch(`/api/messages?userId=${data.user.id}&receiverId=${receiverId}`);
      if (res.ok) {
        const dataJson = await res.json();
        setMessages(dataJson);
      }
    };
    initChat();
  }, [receiverId]);

  // عمل Scroll تلقائي لآخر رسالة
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // دالة الإرسال
  const sendMessage = async () => {
    if (!text.trim()) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: receiverId,
        text: text.trim()
      })
    });

    if (res.ok) {
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setText("");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#efeae2] max-w-md mx-auto shadow-2xl" dir="rtl">
      {/* Header - زي إنستجرام */}
      <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push("/chat")} className="text-xl">➡️</button>
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
          {/* حرف افتراضي */}
          U
        </div>
        <h1 className="font-bold flex-1">دردشة مباشرة</h1>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.senderId === user?.id ? "justify-start" : "justify-end"}`}
          >
            <div 
              className={`p-3 rounded-2xl max-w-[75%] shadow-sm ${
                m.senderId === user?.id 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white text-black rounded-tl-none"
              }`}
            >
              <p className="text-sm">{m.content}</p>
              <span className="text-[10px] opacity-70 block mt-1">
                {new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-slate-100 rounded-full px-5 py-2 outline-none text-sm" 
          placeholder="اكتب رسالة..." 
        />
        <button 
          onClick={sendMessage} 
          className="bg-emerald-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-emerald-700 transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  );
}