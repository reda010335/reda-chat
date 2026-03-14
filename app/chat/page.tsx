"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ChatListPage() {
  const [chats, setChats] = useState([]);
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.push("/login");
      const res = await fetch(`/api/messages/recent?userId=${data.user.id}`);
      setChats(await res.json());
    };
    load();
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white" dir="rtl">
      <header className="p-4 border-b font-bold text-xl flex justify-between">
        <span>الرسائل</span>
        <button onClick={() => router.push("/search")}>🔍</button>
      </header>
      {chats.map((chat: any) => (
        <div key={chat.otherUser.id} onClick={() => router.push(`/chat/${chat.otherUser.id}`)} className="p-4 flex gap-3 border-b active:bg-gray-50">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">{chat.otherUser.profileName[0]}</div>
          <div>
            <p className="font-bold">{chat.otherUser.profileName}</p>
            <p className="text-sm text-gray-500">{chat.lastMessage}</p>
          </div>
        </div>
      ))}
    </div>
  );
}