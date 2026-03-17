"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };
type Message = { id: string; content: string; sender_id: string; receiver_id: string; createdAt: string };

export default function ChatPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const params = useParams();
  const receiverId = params.id as string;

  const [me, setMe] = useState<User | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. تهيئة البيانات (أنت والمستقبل والرسائل القديمة)
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/signup");

      // جلب بياناتك
      const { data: myProfile } = await supabase.from("User").select("*").eq("id", session.user.id).maybeSingle();
      if (myProfile) setMe(myProfile);

      // جلب بيانات المستقبل
      const { data: rec } = await supabase.from("User").select("*").eq("id", receiverId).maybeSingle();
      setReceiver(rec);

      // جلب الرسائل القديمة (بترتيب تصاعدي حسب الوقت)
      const { data: oldMessages } = await supabase
        .from("Message")
        .select("*")
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
        .order("createdAt", { ascending: true });
      
      setMessages(oldMessages || []);
    };
    init();
  }, [receiverId, supabase, router]);

  // 2. نظام Realtime المطور (استقبال الرسائل فوراً)
  useEffect(() => {
    if (!me || !receiverId) return;

    // توحيد اسم الغرفة (مهم جداً عشان الطرفين يسمعوا بعض)
    const roomId = [me.id, receiverId].sort().join("_");

    const channel = supabase
      .channel(`room_${roomId}`)
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "Message" }, 
        (payload) => {
          const msg = payload.new as Message;
          
          // التأكد إن الرسالة تخص هذه المحادثة تحديداً
          const isRelated = (msg.sender_id === me.id && msg.receiver_id === receiverId) || 
                            (msg.sender_id === receiverId && msg.receiver_id === me.id);
          
          if (isRelated) {
            setMessages(prev => {
              // لو الرسالة موجودة أصلاً (بسبب الإرسال الفوري) متكررهاش
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, receiverId, supabase]);

  // 3. النزول لآخر رسالة تلقائياً
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. دالة إرسال الرسالة
  const sendMessage = async () => {
    if (!newMessage.trim() || !me) return;
    
    const content = newMessage;
    setNewMessage("");

    // إنشاء ID مؤقت للرسالة عشان تظهر فوراً (Optimistic UI)
    const tempId = crypto.randomUUID();
    const pendingMsg: Message = { 
      id: tempId, 
      content, 
      sender_id: me.id, 
      receiver_id: receiverId, 
      createdAt: new Date().toISOString() 
    };
    setMessages(prev => [...prev, pendingMsg]);

    // الإرسال الفعلي للداتابيز
    const { error } = await supabase.from("Message").insert([
      { content, sender_id: me.id, receiver_id: receiverId }
    ]);

    if (error) console.error("Error sending message:", error.message);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${receiverId}`)}>
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-200">
            {receiver?.image ? <img src={receiver.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full bg-emerald-500 text-white font-bold">{receiver?.profileName?.[0] || "?"}</div>}
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-slate-800 dark:text-white leading-tight">{receiver?.profileName || "جاري التحميل..."}</h2>
            <span className="text-[11px] text-emerald-500 font-medium animate-pulse">متصل الآن</span>
          </div>
        </div>
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="text-xl text-slate-600 dark:text-slate-400">🔙</span>
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {messages.map((msg) => {
          const isMine = msg.sender_id === me?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-start flex-row-reverse" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 px-4 shadow-sm text-[15px] transition-all ${
                isMine 
                ? "bg-emerald-600 text-white rounded-[18px] rounded-tr-none ml-2 shadow-emerald-200 dark:shadow-none" 
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-[18px] rounded-tl-none mr-2 border dark:border-slate-700"
              }`}>
                {msg.content}
                <div className={`text-[9px] mt-1 opacity-60 font-light ${isMine ? "text-left" : "text-right"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Field */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px]">
          <input 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && sendMessage()} 
            placeholder="اكتب رسالة..." 
            className="flex-1 bg-transparent p-2 px-4 outline-none text-[15px] dark:text-white" 
          />
          <button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
          >
            📩
          </button>
        </div>
      </div>
    </div>
  );
}