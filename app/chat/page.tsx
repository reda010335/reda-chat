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
type UserLite = ConversationItem["otherUser"];

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

      const { data: messages, error } = await supabase
        .from("Message")
        .select("id, content, senderId, receiverId, createdAt")
        .or(`senderId.eq.${user.id},receiverId.eq.${user.id}`)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Fetch recent messages error:", error.message);
      }

      const recent = (messages || []) as Array<{
        senderId: string;
        receiverId: string;
        content: string;
      }>;

      const seen = new Set<string>();
      const summaries: Array<{ otherUserId: string; lastMessage: string }> = [];
      for (const msg of recent) {
        const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (!otherUserId || seen.has(otherUserId)) continue;
        seen.add(otherUserId);
        summaries.push({
          otherUserId,
          lastMessage: msg.content || "ابدأ المحادثة الآن",
        });
      }

      const ids = summaries.map((s) => s.otherUserId);
      const { data: usersData } = ids.length
        ? await supabase
            .from("User")
            .select("id, username, profileName, image")
            .in("id", ids)
        : { data: [] as UserLite[] };

      const usersMap = new Map((usersData || []).map((u) => [u.id, u as UserLite]));
      const data = summaries
        .map((summary) => ({
          otherUser: usersMap.get(summary.otherUserId),
          lastMessage: summary.lastMessage,
        }))
        .filter((item) => item.otherUser?.id);

      if (isMounted) {
        const safeItems = Array.isArray(data) ? data : [];
        setItems(safeItems);
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
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={item.otherUser.image || "/user.png"}
                alt={item.otherUser.profileName || "User"}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h2 className="truncate font-bold text-slate-900 dark:text-white">
                  {item.otherUser.profileName || item.otherUser.username || "User"}
                </h2>
                <p className="truncate text-xs text-emerald-600">
                  @{item.otherUser.username || "unknown"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
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