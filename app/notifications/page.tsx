"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Notification = {
  id: string;
  text?: string | null;
  type: string;
  isRead: boolean;
  created_at: string;
  senderId: string;
  receiverId: string;
  postId?: string;
};

export default function NotificationsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signup");
        return;
      }

      try {
        const { data } = await supabase
          .from("Notification")
          .select("*")
          .eq("receiverId", user.id)
          .order("created_at", { ascending: false });

        if (mounted && data) {
          setNotifications(data as Notification[]);
        }

        await supabase
          .from("Notification")
          .update({ isRead: true })
          .eq("receiverId", user.id);
      } catch (error) {
        console.error("Fetch notifications error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-black text-emerald-600 animate-pulse">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950" dir="rtl">
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b bg-white/80 px-5 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <button onClick={() => router.back()} className="text-sm font-semibold">
          Back
        </button>
        <h1 className="text-xl font-black dark:text-white">Notifications</h1>
      </header>

      <main className="mx-auto max-w-md space-y-3 p-4">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => router.push(`/profile/${notif.senderId}`)}
              className={`flex flex-col gap-2 rounded-2xl border p-4 transition-all ${
                notif.isRead
                  ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-emerald-100 bg-emerald-50/50 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/10"
              }`}
              type="button"
            >
              <p className="text-sm dark:text-white">
                {notif.text ||
                  (notif.type === "like"
                    ? "Someone liked your post."
                    : notif.type === "follow"
                    ? "Someone started following you."
                    : "You have a new interaction.")}
              </p>
              <span className="text-[10px] text-slate-400">
                {new Date(notif.created_at).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </button>
          ))
        )}
      </main>
    </div>
  );
}