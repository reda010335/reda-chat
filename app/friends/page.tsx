"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type User = {
  id: string;
  username: string;
  profileName: string;
  image?: string | null;
};

export default function FriendsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [meId, setMeId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signup");
        return;
      }

      const { data } = await supabase
        .from("User")
        .select("id, username, profileName, image")
        .neq("id", user.id)
        .order("profileName", { ascending: true });

      if (isMounted) {
        setMeId(user.id);
        setUsers((data as User[]) || []);
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    return (
      user.profileName.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6" dir="rtl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Network
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          Discover people
        </h1>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or username"
          className="w-full rounded-[20px] bg-slate-100 px-4 py-3 text-sm outline-none transition focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
        />
      </div>

      <div className="mt-6 space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90"
          >
            <button
              onClick={() => router.push(`/profile/${user.id}`)}
              className="flex items-center gap-3 text-right"
              type="button"
            >
              <img
                src={user.image || "/user.png"}
                alt={user.profileName}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  {user.profileName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{user.username}
                </p>
              </div>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/chat/${user.id}`)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                type="button"
              >
                Chat
              </button>
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                type="button"
              >
                View
              </button>
            </div>
          </div>
        ))}

        {!loading && filteredUsers.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            {meId ? "No users match your search." : "No users found."}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[24px] bg-white/70 p-10 text-center text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
            Loading users...
          </div>
        ) : null}
      </div>
    </div>
  );
}
