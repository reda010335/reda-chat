"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Stories from "@/app/components/Stories";
import CreatePost from "@/app/components/CreatePost";

export default function HomePage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return window.location.replace("/signup");
      const { data: profile } = await supabase.from("User").select("*").eq("id", session.user.id).maybeSingle();
      if (!profile) return window.location.replace("/signup");

      setUser(profile);
      fetchPosts();
      fetchChatUsers(session.user.id);
      checkNotifications(session.user.id);
      setLoading(false);

      supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Notification', filter: `receiverId=eq.${session.user.id}` }, () => setHasNotifications(true)).subscribe();
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("Post").select(`*, author:User(*)`).order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchChatUsers = async (myId: string) => {
    const { data } = await supabase.from("User").select("*").not("id", "eq", myId).limit(10);
    if (data) setChatUsers(data);
  };

  const checkNotifications = async (myId: string) => {
    const { count } = await supabase.from("Notification").select("*", { count: 'exact', head: true }).eq("receiverId", myId).eq("isRead", false);
    setHasNotifications(!!count && count > 0);
  };

  const handleFollow = async (targetId: string) => {
    const { error } = await supabase.from("Follow").insert([{ followerId: user.id, followingId: targetId }]);
    if (!error) {
      await supabase.from("Notification").insert([{ receiverId: targetId, senderId: user.id, type: "follow" }]);
      alert("تمت المتابعة");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl italic">REDA CHAT</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b px-5 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <button onClick={() => router.push('/notifications')} className="relative text-xl">
          🔔 {hasNotifications && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* TAB: Home */}
        {activeTab === "home" && (
          <div className="space-y-4">
            <Stories supabase={supabase} user={user} />
            <CreatePost supabase={supabase} user={user} onPostCreated={fetchPosts} />
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[30px] overflow-hidden shadow-sm border dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={post.author?.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                    <div><h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4></div>
                  </div>
                  {post.authorId !== user.id && <button onClick={() => handleFollow(post.authorId)} className="text-xs text-emerald-600 font-bold">متابعة</button>}
                </div>
                {post.content && <p className="text-sm mb-3 dark:text-slate-300">{post.content}</p>}
                {post.mediaUrl && (
                  post.mediaType === 'video' 
                  ? <video src={post.mediaUrl} controls className="w-full rounded-2xl" />
                  : <img src={post.mediaUrl} className="w-full rounded-2xl max-h-[400px] object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: Friends (Search) */}
        {activeTab === "friends" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث عن أصدقاء..." className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl outline-none text-sm dark:text-white border dark:border-slate-800" />
              <button onClick={async () => {
                const { data } = await supabase.from("User").select("*").ilike("profileName", `%${searchTerm}%`);
                if (data) setSearchResults(data);
              }} className="bg-emerald-600 text-white px-5 rounded-xl font-bold">بحث</button>
            </div>
            {searchResults.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={p.image || "/user.png"} className="w-12 h-12 rounded-full object-cover" />
                  <span className="font-bold dark:text-white">{p.profileName}</span>
                </div>
                <button onClick={() => handleFollow(p.id)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs">متابعة</button>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Chat */}
        {activeTab === "chat" && (
          <div className="space-y-3">
            <h2 className="text-xl font-black mb-4 dark:text-white">الدردشة</h2>
            {chatUsers.map(u => (
              <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4 border dark:border-slate-800 cursor-pointer">
                <img src={u.image || "/user.png"} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1"><h4 className="font-bold dark:text-white">{u.profileName}</h4><p className="text-xs text-slate-400">اضغط للدردشة</p></div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border dark:border-slate-800 text-center">
            <img src={user.image || "/user.png"} className="w-32 h-32 rounded-[40px] mx-auto mb-6 object-cover border-4 border-emerald-500" />
            <h2 className="text-2xl font-black dark:text-white">{user.profileName}</h2>
            <p className="text-emerald-600 font-bold mb-6">@{user.username}</p>
            <button onClick={() => router.push('/settings')} className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold mb-3 dark:text-white text-sm">الإعدادات</button>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.replace("/signup"); }} className="w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black text-sm">خروج</button>
          </div>
        )}
      </main>

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t p-4 flex justify-around z-50 shadow-2xl">
        <NavBtn icon="🏠" label="الرئيسية" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavBtn icon="👥" label="الأصدقاء" active={activeTab === "friends"} onClick={() => setActiveTab("friends")} />
        <NavBtn icon="💬" label="الدردشة" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
        <NavBtn icon="👤" label="أنا" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center transition-all ${active ? "text-emerald-600 scale-110 font-black" : "text-slate-400 opacity-50"}`}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}