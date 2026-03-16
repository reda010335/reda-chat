"use client";
import { useEffect, useState, useCallback } from "react"; // ضفنا useCallback لضمان استقرار الدالة
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
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);

  // دالة جلب المنشورات خليناها بره useEffect عشان نعرف نستخدمها في كذا مكان
  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("Post")
      .select(`*, author:User(*)`)
      .order("createdAt", { ascending: false });
    
    if (!error) {
      setPosts(data || []);
    }
  }, [supabase]);

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
      checkNotifications(session.user.id);
      setLoading(false);

      // --- الجزء السحري: Realtime ---
      // ده بيخلي الصفحة "تسمع" الداتابيز، أول ما بوست جديد ينزل، الصفحة تحدث نفسها لوحدها
      const channel = supabase.channel('realtime-posts')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'Post' }, 
          () => {
            fetchPosts(); // تحديث فوري عند النشر
          }
        )
        .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'Post' }, 
          () => {
            fetchPosts(); // تحديث فوري عند الحذف
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    init();
  }, [fetchPosts, supabase]);

  const checkNotifications = async (myId: string) => {
    const { count } = await supabase.from("Notification")
      .select("*", { count: 'exact', head: true })
      .eq("receiverId", myId).eq("isRead", false);
    setHasNotifications(!!count && count > 0);
  };

  const deletePost = async (postId: string) => {
    if (!confirm("هل تريد حذف هذا المنشور؟")) return;
    const { error } = await supabase.from("Post").delete().eq("id", postId);
    if (!error) fetchPosts();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-4xl font-black text-emerald-600 animate-bounce italic">REDA</div>
      <div className="w-12 h-1 bg-emerald-600 rounded-full animate-pulse mt-2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24 font-sans" dir="rtl">
      {/* الـ Header وتصميمك زي ما هو بالظبط */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent italic">REDA CHAT</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Social Media</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/notifications')} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative transition-transform active:scale-90">
            <span className="text-xl">🔔</span>
            {hasNotifications && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {activeTab === "home" && (
          <>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
              <Stories supabase={supabase} user={user} />
            </div>

            {/* مررنا fetchPosts هنا عشان الكومبوننت يناديها أول ما النشر يخلص */}
            <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />

            <div className="space-y-5">
              {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[35px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 overflow-hidden group">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300">
                          <img src={post.author?.image || "/user.png"} className="w-11 h-11 rounded-full object-cover border-2 border-white" alt="avatar" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{post.author?.profileName}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">منذ {new Date(post.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      
                      {post.authorId === user.id && (
                        <button onClick={() => deletePost(post.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 flex items-center justify-center transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                    
                    {post.content && <p className="text-[15px] dark:text-slate-300 leading-relaxed mb-4 px-1">{post.content}</p>}
                    
                    {post.mediaUrl && (
                      <div className="rounded-[25px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {post.mediaType === 'video' ? (
                          <video src={post.mediaUrl} controls className="w-full aspect-video object-cover" />
                        ) : (
                          <img src={post.mediaUrl} className="w-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-500" alt="post media" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* الـ Nav Bar زي ما هو */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[30px] border border-white/20 dark:border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-around items-center px-4 z-[100]">
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
    <button onClick={onClick} className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 -translate-y-2" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
      <span className="text-2xl">{icon}</span>
      {active && <span className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full"></span>}
    </button>
  );
}