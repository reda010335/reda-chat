"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Stories from "@/app/components/Stories";
import CreatePost from "@/app/components/CreatePost";
// تأكد من استيراد المكونات دي لو موجودة عندك في ملفات منفصلة
// import Friends from "@/app/components/Friends"; 

export default function HomePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [chatUsers, setChatUsers] = useState<any[]>([]);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("Post")
      .select(`*, author:User(*)`)
      .order("createdAt", { ascending: false });
    if (!error) setPosts(data || []);
  }, [supabase]);

  const fetchChatUsers = async (myId: string) => {
    const { data } = await supabase.from("User").select("*").not("id", "eq", myId).limit(10);
    if (data) setChatUsers(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return window.location.replace("/signup");

      const { data: profile } = await supabase
        .from("User")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) return window.location.replace("/signup");

      setUser(profile);
      await fetchPosts();
      fetchChatUsers(session.user.id);
      setLoading(false);
    };
    init();
  }, [fetchPosts, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl italic">REDA</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent italic">REDA CHAT</h1>
        <button onClick={() => router.push('/notifications')} className="text-xl">🔔</button>
      </header>

      <main className="max-w-xl mx-auto p-4">
        
        {/* محتوى الرئيسية */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
              <Stories supabase={supabase} user={user} />
            </div>
            <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />
            <div className="space-y-5">
              {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[35px] p-5 shadow-sm border border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={post.author?.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                       <h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4>
                       <p className="text-[10px] text-slate-400">منذ {new Date(post.createdAt).toLocaleTimeString('ar-EG')}</p>
                    </div>
                  </div>
                  {post.content && <p className="text-sm dark:text-slate-300 mb-3">{post.content}</p>}
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} className="w-full rounded-[25px] object-cover max-h-96" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* محتوى الأصدقاء */}
        {activeTab === "friends" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 dark:text-white">اكتشف أصدقاء جدد</h2>
            <p className="text-slate-400 text-sm">قريباً: عرض قائمة المقترحين هنا..</p>
          </div>
        )}

        {/* محتوى الدردشة */}
        {activeTab === "chat" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4 dark:text-white">المحادثات</h2>
            {chatUsers.map(u => (
              <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4 cursor-pointer shadow-sm">
                <img src={u.image || "/user.png"} className="w-12 h-12 rounded-full object-cover" />
                <span className="font-bold dark:text-white">{u.profileName}</span>
              </div>
            ))}
          </div>
        )}

        {/* محتوى البروفايل */}
        {activeTab === "profile" && (
          <div className="text-center bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-sm">
             <img src={user.image || "/user.png"} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-emerald-500" />
             <h2 className="text-2xl font-bold dark:text-white">{user.profileName}</h2>
             <p className="text-emerald-600 mb-6">@{user.username}</p>
             <button onClick={() => supabase.auth.signOut().then(() => router.push('/signup'))} className="bg-red-50 text-red-500 px-8 py-3 rounded-2xl font-bold">تسجيل الخروج</button>
          </div>
        )}

      </main>

      {/* Nav Bar - تأكد من أن الـ onClick هنا بتغير الـ activeTab */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[30px] border border-white/20 shadow-xl flex justify-around items-center px-4 z-[100]">
        <NavBtn icon="🏠" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavBtn icon="👥" active={activeTab === "friends"} onClick={() => setActiveTab("friends")} />
        <NavBtn icon="💬" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
        <NavBtn icon="👤" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${active ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400"}`}>
      <span className="text-2xl">{icon}</span>
    </button>
  );
}