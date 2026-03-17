"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const { id } = useParams();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.from("User").select("*").eq("id", id).maybeSingle();
      if (!data) return alert("المستخدم غير موجود");
      setUser(data);
    };
    fetchUser();
  }, [id]);

  if (!user) return <div className="flex justify-center items-center h-screen">جار التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6" dir="rtl">
      <button onClick={() => router.back()} className="mb-4 text-emerald-600 font-bold">⬅️ رجوع</button>
      <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md">
        <img src={user.image || "/user.png"} className="w-24 h-24 rounded-full mb-4 object-cover" />
        <h2 className="text-2xl font-black dark:text-white">{user.profileName}</h2>
        <p className="text-slate-500 dark:text-slate-300 mb-4">@{user.username}</p>
        <button className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">متابعة</button>
      </div>
    </div>
  );
}