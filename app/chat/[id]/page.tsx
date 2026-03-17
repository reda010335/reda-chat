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
  }, [receiverId]);

  // نظام الاستقبال (Realtime) - معدل لاستقبال المكالمات
  useEffect(() => {
    if (!me || !receiverId) return;
    const roomId = [me.id, receiverId].sort().join("_");

    const channel = supabase
      .channel(`room_${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, (payload) => {
          const msg = payload.new as Message;
          
          // استقبال المكالمة لو موجهة ليك
          if (msg.type === "call" && msg.receiver_id === me.id) {
             if (confirm(`مكالمة واردة من ${receiver?.profileName}.. رد؟`)) {
                router.push(`/call/${msg.call_id}`);
             }
          }

          if ((msg.sender_id === me.id && msg.receiver_id === receiverId) || (msg.sender_id === receiverId && msg.receiver_id === me.id)) {
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me, receiverId, receiver]);

  // دالة بدء المكالمة
  const startCall = async (type: 'audio' | 'video') => {
    if (!me) return;
    const callId = [me.id, receiverId].sort().join("_");
    await supabase.from("Message").insert([{
      content: `📞 بدأ مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'}...`,
      sender_id: me.id,
      receiver_id: receiverId,
      type: "call",
      call_id: callId
    }]);
    router.push(`/call/${callId}`);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !me) return;
    const content = newMessage;
    setNewMessage("");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), content, sender_id: me.id, receiver_id: receiverId, createdAt: new Date().toISOString() }]);
    await supabase.from("Message").insert([{ content, sender_id: me.id, receiver_id: receiverId, type: "text" }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      <header className="bg-white/90 dark:bg-slate-900/90 p-3 px-4 flex items-center justify-between border-b dark:border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-200">
            {receiver?.image ? <img src={receiver.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white">?</div>}
          </div>
          <h2 className="font-bold text-slate-800 dark:text-white text-sm">{receiver?.profileName}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => startCall('audio')} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">📞</button>
          <button onClick={() => startCall('video')} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">📹</button>
          <button onClick={() => router.back()} className="text-xl px-2">🔙</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === me?.id ? "justify-start flex-row-reverse" : "justify-start"}`}>
            <div className={`max-w-[75%] p-3 px-4 rounded-[18px] text-sm ${msg.type === 'call' ? 'bg-amber-100 text-amber-900 mx-auto' : msg.sender_id === me?.id ? 'bg-emerald-600 text-white rounded-tr-none ml-2' : 'bg-white text-slate-800 border rounded-tl-none mr-2'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="اكتب رسالة..." className="flex-1 bg-slate-100 p-2 px-4 rounded-full outline-none" />
        <button onClick={sendMessage} className="bg-emerald-600 text-white w-10 h-10 rounded-full">📩</button>
      </div>
    </div>
  );
}