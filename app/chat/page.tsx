"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    profileName: string;
  };
};

export default function ChatRoomPage() {
  const { id: receiverId } = useParams(); // الـ ID بتاع الشخص اللي بكلمه
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. التحقق من المستخدم وجلب الرسائل
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      fetchMessages(user.id);
    };
    initChat();
  }, [receiverId]);

  // 2. جلب الرسائل من الـ API اللي إنت عملته
  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}&receiverId=${receiverId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // 3. إرسال رسالة جديدة
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageData = {
      senderId: currentUser.id,
      receiverId: receiverId,
      text: newMessage.trim(),
    };

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify(messageData),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) => [...prev, savedMsg]);
        setNewMessage("");
        // سكرول لتحت
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-white p-4 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-500">➡️</button>
        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
          {messages[0]?.sender?.profileName?.charAt(0) || "U"}
        </div>
        <h1 className="font-bold text-slate-800">محادثة مباشرة</h1>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser?.id ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.senderId === currentUser?.id
                  ? "bg-emerald-500 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
              }`}
            >
              <p>{msg.content}</p>
              <span className="mt-1 block text-[9px] opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t bg-white p-4 pb-8">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-transparent py-2 outline-none text-sm"
          />
          <button type="submit" className="text-emerald-500 text-xl active:scale-90 transition-transform">
            🚀
          </button>
        </div>
      </form>
    </div>
  );
}
