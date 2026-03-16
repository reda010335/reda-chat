"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Stories from "@/app/components/Stories";
import CreatePost from "@/app/components/CreatePost";

export default function HomePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  // جلب المنشورات
  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("Post")
      .select(`*, author:User(*)`)
      .order("createdAt", { ascending: false });
    if (!error) setPosts(data || []);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/signup");

      const { data: profile } = await supabase
        .from("User")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) return router.push("/signup");

      setUser(profile);
      await fetchPosts();
      setLoading(false);
    };
    init();
  }, [fetchPosts, supabase, router]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl italic">
        REDA
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent italic">
          REDA CHAT
        </h1>
        <button
          onClick={() => router.push("/notifications")}
          className="text-xl"
        >
          🔔
        </button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* Stories */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
          <Stories supabase={supabase} user={user} />
        </div>

        {/* Create Post */}
        <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />

        {/* Posts */}
        <div className="space-y-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-[35px] p-5 shadow-sm border border-slate-50 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={post.author?.image || "/user.png"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm dark:text-white">
                    {post.author?.profileName}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    منذ {new Date(post.createdAt).toLocaleTimeString("ar-EG")}
                  </p>
                </div>
              </div>
              {post.content && (
                <p className="text-sm dark:text-slate-300 mb-3">{post.content}</p>
              )}
              {post.mediaUrl && (
                <img
                  src={post.mediaUrl}
                  className="w-full rounded-[25px] object-cover max-h-96"
                />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}