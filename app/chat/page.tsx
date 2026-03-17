"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ConversationItem = {
  otherUser: {
    id: string;
    username?: string;
    profileName?: string;
    image?: string | null;
  };
  lastMessage: string;
};

export default function ChatIndexPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [items, setItems] = useState<ConversationItem[]>([]);
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

      const res = await fetch(`/api/messages/recent?userId=${user.id}`);
      const data = await res.json();

      if (isMounted) {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6" dir="rtl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Messages
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          Chats
        </h1>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.otherUser.id}
            onClick={() => router.push(`/chat/${item.otherUser.id}`)}
            className="flex w-full items-center justify-between rounded-[24px] border border-white/70 bg-white/90 p-4 text-right shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:translate-y-[-1px] dark:border-slate-800 dark:bg-slate-900/90"
            type="button"
          >
            <div className="flex items-center gap-3">
              <img
                src={item.otherUser.image || "/user.png"}
                alt={item.otherUser.profileName || "User"}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  {item.otherUser.profileName || item.otherUser.username || "User"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {item.lastMessage}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-emerald-600">Open</span>
          </button>
        ))}

        {!loading && items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            No conversations yet. Start chatting from the friends page.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[24px] bg-white/70 p-10 text-center text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
            Loading conversations...
          </div>
        ) : null}
      </div>
    </div>
  );
}
