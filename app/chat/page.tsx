"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };

export default function ChatListPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");

      const { data: users } = await supabase.from("User").select("*").not("id", "eq", user.id).order("profileName", { ascending: true });
      setAllUsers(users || []);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4" dir="rtl">
      <h1 className="text-2xl font-black mb-6">المحادثات</h1>
      <div className="space-y-3">
        {allUsers.map(u => (
          <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-emerald-50 transition-colors">
            <div className="flex items-center gap-3">
              <img src={u.image || "/user.png"} className="w-12 h-12 rounded-full object-cover" />
              <span className="font-bold text-slate-800">{u.profileName}</span>
            </div>
            <span className="text-xs text-emerald-600 font-bold">دردشة ←</span>
          </div>
        ))}
      </div>
    </div>
  );
}