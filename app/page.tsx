"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePost from "@/app/components/CreatePost";
import Stories from "@/app/components/Stories";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type UserProfile = {
  id: string;
  profileName: string;
  username: string;
  image?: string | null;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
  image?: string | null;
  author?: UserProfile | null;
};

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("Post")
      .select("id, content, createdAt, image, author:User(id, profileName, username, image)")
      .order("createdAt", { ascending: false });

    if (!error) {
      setPosts((data as Post[]) || []);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signup");
        return;
      }

      const { data: profile } = await supabase
        .from("User")
        .select("id, profileName, username, image")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/signup");
        return;
      }

      if (isMounted) {
        setUser(profile as UserProfile);
      }

      await fetchPosts();

      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl font-black italic text-emerald-600">
        REDA CHAT
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Social Feed
            </p>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              REDA CHAT
            </h1>
          </div>
          <button
            onClick={() => router.push("/notifications")}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-slate-800"
          >
            Notifications
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
          <Stories supabase={supabase} user={user} />
        </section>

        {user && (
          <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />
        )}

        <section className="space-y-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={post.author?.image || "/user.png"}
                  alt={post.author?.profileName || "User"}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {post.author?.profileName || "Unknown user"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>

              {post.content ? (
                <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {post.content}
                </p>
              ) : null}

              {post.image ? (
                <img
                  src={post.image}
                  alt="Post media"
                  className="max-h-[28rem] w-full rounded-[24px] object-cover"
                />
              ) : null}
            </article>
          ))}

          {posts.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
              No posts yet. Create the first one.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
