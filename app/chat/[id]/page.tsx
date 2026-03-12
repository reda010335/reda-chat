"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  id: string;
  content: string; 
  createdAt: string;
  senderId: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = String(params.id);
  
  // استخدام الطريقة الجديدة والأصح لـ Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. جلب المستخدم الحالي
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // 2. تحميل المحادثة والرسائل والاشتراك في Realtime
  useEffect(() => {
    if (!currentUser?.id || !conversationId) return;

    loadConversation();
    loadMessages();

    // إعداد الـ Realtime
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // منع تكرار الرسالة لو وصلت مرتين
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, conversationId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversation() {
    try {
      const res = await fetch(`/api/conversations/details?id=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      }
    } catch (error) {
      console.log("loadConversation error:", error);
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
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
          conversationId,
          senderId: currentUser.id,
          content: currentText,
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
    <div className="min-h-screen bg-[#efeae2] flex justify-center font-sans">
      <div className="flex h-screen w-full max-w-md flex-col bg-[#efeae2] shadow-xl relative border-x border-slate-200">
        
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/chat")} className="text-2xl text-slate-600 hover:text-emerald-600">←</button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-lg shadow-inner">
              {conversation?.otherUser?.profileName?.charAt(0) || "U"}
            </div>
            <div className="text-right">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {conversation?.otherUser?.profileName || "جاري التحميل..."}
              </h1>
              <p className="text-[10px] text-emerald-600 font-medium">متصل الآن</p>
            </div>
          </div>
          <div className="flex gap-4 text-slate-500">
             <button className="hover:text-emerald-600 transition-colors">📞</button>
             <button className="hover:text-emerald-600 transition-colors">⋮</button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm relative ${
                  isMe ? "bg-[#dcf8c6] rounded-tr-none text-slate-900" : "bg-white rounded-tl-none text-slate-900"
                }`}>
                  <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                  <span className="text-[9px] text-slate-500 block text-left mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#f0f0f0] flex items-center gap-2 border-t border-slate-200">
           <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب رسالة..."
              className="flex-1 rounded-full py-2.5 px-5 outline-none text-right text-slate-800 shadow-sm focus:ring-1 focus:ring-emerald-500"
           />
           <button 
             onClick={sendMessage}
             disabled={!text.trim() || sending}
             className="bg-emerald-600 text-white h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-50 shadow-md active:scale-90 transition-transform"
           >
             {sending ? <span className="animate-pulse">..</span> : "➤"}
           </button>
        </div>
      </div>
    </div>
  );
}