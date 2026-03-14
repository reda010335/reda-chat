"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: { profileName: string; username: string };
  likes_count: number;
};

export default function Home() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. جلب بيانات المستخدم والبوستات
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("User").select("*").eq("id", user.id).single();
        setUser(profile);
      }

      const { data: postsData } = await supabase
        .from("Post")
        .select(`*, author:User(profileName, username)`)
        .order("createdAt", { ascending: false });
      
      setPosts(postsData || []);
    };
    fetchData();
  }, []);

  // 2. وظيفة نشر بوست جديد
  const handlePost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("Post").insert([
      { content: newPost, authorId: user.id }
    ]);
    
    if (!error) {
      setNewPost("");
      window.location.reload(); // تحديث الصفحة لرؤية البوست الجديد
    }
    setLoading(false);
  };

  if (!user) return <div className="text-center p-10 font-bold">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
          {user.profileName[0]}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Create Post Card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={`بماذا تفكر يا ${user.profileName}؟`}
              className="w-full bg-slate-50 rounded-2xl p-3 text-sm outline-none resize-none focus:ring-1 ring-emerald-500"
              rows={3}
            />
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <button className="text-slate-500 text-sm flex items-center gap-1">🖼️ صورة</button>
            <button
              onClick={handlePost}
              disabled={loading}
              className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              {loading ? "جاري النشر..." : "نشر"}
            </button>
          </div>
        </div>

        {/* Feed - قائمة المنشورات */}
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                {post.author?.profileName[0] || "U"}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{post.author?.profileName}</p>
                <p className="text-[10px] text-slate-400">@{post.author?.username} • منذ قليل</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>
            <div className="flex justify-around border-t pt-3 text-slate-500 text-sm">
              <button className="flex items-center gap-2 hover:text-emerald-500">👍 إعجاب</button>
              <button className="flex items-center gap-2 hover:text-emerald-500">💬 تعليق</button>
              <button className="flex items-center gap-2 hover:text-emerald-500">↗️ مشاركة</button>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center z-50">
        <button className="flex flex-col items-center text-emerald-600">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button onClick={() => window.location.href='/friends'} className="flex flex-col items-center text-slate-400">
          <span className="text-xl">👥</span>
          <span className="text-[10px] font-bold">الأصدقاء</span>
        </button>
        <button onClick={() => window.location.href='/chat'} className="flex flex-col items-center text-slate-400">
          <span className="text-xl">💬</span>
          <span className="text-[10px] font-bold">الدردشة</span>
        </button>
        <button onClick={() => window.location.href='/settings'} className="flex flex-col items-center text-slate-400">
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-bold">الإعدادات</span>
        </button>
      </nav>
    </div>
  );
}