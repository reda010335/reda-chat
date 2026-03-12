"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; // المكتبة الجديدة

type User = {
  id: string;
  username: string;
  profileName: string;
};

type Conversation = {
  id: string;
  otherUser: User;
  lastMessage?: string;
};

export default function ChatListPage() {
  const router = useRouter();
  
  // إعداد سوبابيز بالطريقة الجديدة للـ Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // جلب المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login"); 
      } else {
        setCurrentUser(user);
        loadConversations(user.id);
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  async function loadConversations(userId: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations?userId=${userId}`);
      
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("خطأ في تحميل المحادثات:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl relative">
        
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-5 py-4 flex justify-between items-center">
           <button onClick={() => router.push("/search")} className="text-slate-400 text-xl">🔍</button>
           <h1 className="text-xl font-extrabold text-slate-800">الدردشات</h1>
           <div className="h-8 w-8 rounded-full bg-emerald-500"></div>
        </header>

        {/* LIST */}
        <div className="divide-y divide-slate-50 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {loading ? (
            <p className="p-10 text-center text-slate-400 animate-pulse">جاري تحميل محادثاتك...</p>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-slate-500">لا توجد محادثات بعد</p>
              <button 
                onClick={() => router.push("/search")}
                className="mt-4 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform"
              >
                البحث عن أصدقاء
              </button>
            </div>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="flex w-full items-center gap-4 p-4 transition-all hover:bg-slate-50 active:bg-slate-100 border-none outline-none"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 font-bold text-emerald-700 text-lg shadow-sm">
                  {chat?.otherUser?.profileName?.charAt(0) || "?"}
                </div>

                <div className="flex-1 text-right overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400">اليوم</span>
                    <p className="font-bold text-slate-900 truncate">
                      {chat?.otherUser?.profileName}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {chat.lastMessage || `ابدأ الدردشة مع @${chat?.otherUser?.username}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t border-slate-100 bg-white/90 backdrop-blur-md py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>
          <button onClick={() => router.push("/search")} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500">
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-bold">بحث</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-emerald-600">
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold">الدردشات</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500">
            <span className="text-xl">🚪</span>
            <span className="text-[10px] font-bold">خروج</span>
          </button>
        </nav>

      </div>
    </div>
  );
}