"use client";
import { useEffect, useState } from "react";
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

      // Realtime: تحديث المنشورات فوراً عند إضافة أي بوست جديد
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Post' }, () => {
          fetchPosts(); // تحديث القائمة أول ما حد ينشر
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'Post' }, () => {
          fetchPosts(); // تحديث القائمة أول ما حد يمسح
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("Post")
      .select(`*, author:User(*)`)
      .order("createdAt", { ascending: false });
    
    if (!error) setPosts(data || []);
  };

  const checkNotifications = async (myId: string) => {
    const { count } = await supabase.from("Notification")
      .select("*", { count: 'exact', head: true })
      .eq("receiverId", myId).eq("isRead", false);
    setHasNotifications(!!count && count > 0);
  };

  // دالة الحذف اللي طلبتها
  const deletePost = async (postId: string) => {
    if (confirm("هل تريد حذف المنشور؟")) {
      const { error } = await supabase.from("Post").delete().eq("id", postId);
      if (error) alert("فشل الحذف");
      // الـ Realtime هيحدث القائمة تلقائياً
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl italic">REDA CHAT</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-right" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b px-5 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <button onClick={() => router.push('/notifications')} className="relative text-xl">
          🔔 {hasNotifications && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4">
        {activeTab === "home" && (
          <div className="space-y-4">
            <Stories supabase={supabase} user={user} />
            
            {/* أهم تعديل: مررنا fetchPosts عشان لما ينشر الصفحة تحس بيه */}
            <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />
            
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={post.author?.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4>
                      <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                  
                  {/* زر الحذف */}
                  {post.authorId === user.id && (
                    <button onClick={() => deletePost(post.id)} className="text-red-400 text-xs">حذف</button>
                  )}
                </div>
                
                {post.content && <p className="text-sm mb-3 dark:text-slate-300">{post.content}</p>}
                
                {post.mediaUrl && (
                  <div className="mt-2">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="w-full rounded-xl" />
                    ) : (
                      <img src={post.mediaUrl} className="w-full rounded-xl object-cover" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* باقي التابات... */}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around z-50">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">الرئيسية</span>
        </button>
        <button onClick={() => setActiveTab("friends")} className={`flex flex-col items-center ${activeTab === 'friends' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-xl">👥</span>
          <span className="text-[10px]">الأصدقاء</span>
        </button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center ${activeTab === 'chat' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-xl">💬</span>
          <span className="text-[10px]">الدردشة</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-xl">👤</span>
          <span className="text-[10px]">بروفايل</span>
        </button>
      </nav>
    </div>
  );
}