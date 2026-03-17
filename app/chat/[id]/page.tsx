"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };
type Message = { id: string; content: string; sender_id: string; receiver_id: string; createdAt: string; type?: string; call_id?: string };

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

  // 1. تهيئة البيانات
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/signup");

      const { data: myProfile } = await supabase.from("User").select("*").eq("id", session.user.id).maybeSingle();
      if (myProfile) setMe(myProfile);

      const { data: rec } = await supabase.from("User").select("*").eq("id", receiverId).maybeSingle();
      setReceiver(rec);

      const { data: oldMessages } = await supabase
        .from("Message")
        .select("*")
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
        .order("createdAt", { ascending: true });
      
      setMessages(oldMessages || []);
    };
    init();
  }, [receiverId, supabase, router]);

  // 2. نظام Realtime (استقبال الرسائل والمكالمات)
  useEffect(() => {
    if (!me || !receiverId) return;
    const roomId = [me.id, receiverId].sort().join("_");

    const channel = supabase
      .channel(`room_${roomId}`)
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "Message" }, 
        (payload) => {
          const msg = payload.new as Message;
          
          // إذا كانت إشارة مكالمة واردة لي
          if (msg.type === "call" && msg.receiver_id === me.id) {
             if (confirm(`مكالمة واردة من ${receiver?.profileName}.. هل تود الرد؟`)) {
                router.push(`/call/${msg.call_id}`);
             }
          }

          const isRelated = (msg.sender_id === me.id && msg.receiver_id === receiverId) || 
                            (msg.sender_id === receiverId && msg.receiver_id === me.id);
          
          if (isRelated) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me, receiverId, receiver, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. دالة بدء المكالمة (صوت أو فيديو)
  const startCall = async (callType: 'audio' | 'video') => {
    if (!me || !receiverId) return;
    
    const callId = [me.id, receiverId].sort().join("_");

    // إرسال إشارة المكالمة للطرف التاني
    const { error } = await supabase.from("Message").insert([
      { 
        content: `📞 بدأ مكالمة ${callType === 'video' ? 'فيديو' : 'صوتية'}...`, 
        sender_id: me.id, 
        receiver_id: receiverId,
        type: "call",
        call_id: callId
      }
    ]);

    if (!error) {
      router.push(`/call/${callId}`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !me) return;
    const content = newMessage;
    setNewMessage("");

    const tempId = crypto.randomUUID();
    const pendingMsg: Message = { id: tempId, content, sender_id: me.id, receiver_id: receiverId, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, pendingMsg]);

    await supabase.from("Message").insert([{ content, sender_id: me.id, receiver_id: receiverId, type: "text" }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      {/* Header المحدث مع زراير الاتصال */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${receiverId}`)}>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-200">
            {receiver?.image ? <img src={receiver.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full bg-emerald-500 text-white font-bold">{receiver?.profileName?.[0] || "?"}</div>}
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-slate-800 dark:text-white leading-tight text-sm md:text-base">{receiver?.profileName || "..."}</h2>
            <span className="text-[10px] text-emerald-500 font-medium animate-pulse">متصل الآن</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* زر مكالمة صوتية */}
          <button 
            onClick={() => startCall('audio')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            📞
          </button>
          {/* زر مكالمة فيديو */}
          <button 
            onClick={() => startCall('video')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            📹
          </button>
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="text-lg">🔙</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {messages.map((msg) => {
          const isMine = msg.sender_id === me?.id;
          const isCall = msg.type === "call";

          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-start flex-row-reverse" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 px-4 shadow-sm text-[14px] transition-all ${
                isCall 
                ? "bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl mx-auto text-center"
                : isMine 
                ? "bg-emerald-600 text-white rounded-[18px] rounded-tr-none ml-2 shadow-emerald-200 dark:shadow-none" 
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-[18px] rounded-tl-none mr-2 border dark:border-slate-700"
              }`}>
                {msg.content}
                {!isCall && (
                  <div className={`text-[9px] mt-1 opacity-60 font-light ${isMine ? "text-left" : "text-right"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
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
            className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all disabled:opacity-50"
          >
            📩
          </button>
        </div>
      </div>
    </div>
  );
}