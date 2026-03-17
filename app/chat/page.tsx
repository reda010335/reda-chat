"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type User = { id: string; profileName: string; username: string; image?: string };

export default function FriendsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [friends, setFriends] = useState<User[]>([]);
  const [meId, setMeId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      setMeId(user.id);

      // جلب كل المستخدمين عدا نفسك
      const { data } = await supabase
        .from("User")
        .select("*")
        .neq("id", user.id);

      setFriends(data as User[]);
    };

    init();
  }, [router, supabase]);

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">الأصدقاء</h1>
      <ul className="space-y-2">
        {friends.map(friend => (
          <li 
            key={friend.id} 
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => router.push(`/chat/${friend.id}`)}
          >
            <img src={friend.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 dark:text-white">{friend.profileName}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">@{friend.username}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}