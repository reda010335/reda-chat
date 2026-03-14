"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // جلب كل المستخدمين ما عدا أنا (عشان أكلمهم)
      const { data } = await supabase.from("User").select("*").not("id", "eq", user?.id);
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <header className="p-5 border-b sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-black text-slate-900">المحادثات</h1>
      </header>
      <div className="p-2">
        {users.map(u => (
          <div 
            key={u.id} 
            onClick={() => router.push(`/chat/${u.id}`)}
            className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer rounded-2xl transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl shadow-sm">
              {u.profileName[0]}
            </div>
            <div className="flex-1 border-b border-slate-50 pb-2">
              <h3 className="font-bold text-slate-800">{u.profileName}</h3>
              <p className="text-xs text-slate-400">اضغط لبدء الدردشة مع @{u.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}