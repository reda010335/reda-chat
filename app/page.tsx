"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

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
  const [newPost, setNewPost] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/signup"; // نستخدم window لضمان التحويل الكامل
      } else {
        const { data: profile } = await supabase.from("User").select("*").eq("id", authUser.id).maybeSingle();
        if (!profile) {
           window.location.href = "/signup";
           return;
        }
        setUser(profile);
        fetchPosts();
        fetchChatUsers(authUser.id);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("Post").select(`*, author:User(profileName, username, image)`).order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchChatUsers = async (myId: string) => {
    const { data } = await supabase.from("User").select("*").not("id", "eq", myId);
    if (data) setChatUsers(data || []);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const { data } = await supabase.from("User").select("*").or(`username.ilike.%${searchTerm}%,profileName.ilike.%${searchTerm}%`);
    if (data) setSearchResults(data);
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    const { error } = await supabase.from("Post").insert([{ content: newPost, authorId: user.id }]);
    if (!error) {
      setNewPost("");
      fetchPosts();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl uppercase">REDA CHAT</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-5 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-emerald-600 italic tracking-tighter">REDA CHAT</h1>
        <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden shadow-sm border-2 border-white dark:border-slate-700">
          {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.profileName[0]}</div>}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {activeTab === "home" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[25px] p-4 shadow-sm border dark:border-slate-800">
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={`بماذا تفكر يا ${user.profileName}؟`} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none resize-none mb-3 dark:text-white" rows={2} />
              <div className="flex justify-end"><button onClick={handlePost} className="bg-emerald-600 text-white px-8 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all">نشر</button></div>
            </div>
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[25px] p-5 shadow-sm border dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden flex items-center justify-center font-bold text-emerald-600">
                    {post.author?.image ? <img src={post.author.image} className="w-full h-full object-cover" /> : post.author?.profileName?.[0]}
                  </div>
                  <div><h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4><p className="text-[10px] text-slate-400">@{post.author?.username}</p></div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="ابحث عن صديق..." className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-2xl outline-none shadow-sm dark:text-white border dark:border-slate-800" />
              <button onClick={handleSearch} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold">بحث</button>
            </div>
            {searchResults.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-emerald-600">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-full" /> : p.profileName[0]}
                  </div>
                  <div><p className="font-bold text-sm dark:text-white">{p.profileName}</p><p className="text-[10px] text-slate-400">@{p.username}</p></div>
                </div>
                <button onClick={() => router.push(`/chat/${p.id}`)} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs">دردشة</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-2">
            <h2 className="text-xl font-black mb-4 dark:text-white px-2">المحادثات</h2>
            {chatUsers.map(u => (
              <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all border dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden flex items-center justify-center font-bold text-emerald-600">
                  {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : u.profileName[0]}
                </div>
                <div><h4 className="font-bold dark:text-white">{u.profileName}</h4><p className="text-xs text-slate-400">اضغط للبدء..</p></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[35px] p-8 shadow-sm border dark:border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-emerald-600"></div>
              <div className="w-28 h-28 rounded-[35px] border-4 border-white dark:border-slate-900 bg-slate-100 mx-auto relative z-10 overflow-hidden mt-4">
                {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-emerald-600">{user.profileName[0]}</div>}
              </div>
              <h2 className="mt-4 text-2xl font-black dark:text-white">{user.profileName}</h2>
              <p className="text-emerald-500 font-bold mb-6">@{user.username}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><span className="text-slate-400 block text-[10px]">العمر</span><span className="font-bold dark:text-white">{user.age || "--"}</span></div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><span className="text-slate-400 block text-[10px]">البلد</span><span className="font-bold dark:text-white">{user.country || "غير محدد"}</span></div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/signup"; }} className="w-full mt-8 p-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-bold text-sm active:scale-95 transition-all">تسجيل الخروج</button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t dark:border-slate-800 p-4 flex justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
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
    <button onClick={onClick} className={`flex flex-col items-center transition-all ${active ? "text-emerald-600 scale-110 font-bold" : "text-slate-400 opacity-60"}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}