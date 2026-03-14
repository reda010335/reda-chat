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
  
  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);

  // 1. فحص المستخدم وتحميل البيانات الأساسية
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push("/signup");
          return;
        }

        // جلب بروفايل المستخدم من جدول User
        const { data: profile, error: profileError } = await supabase
          .from("User")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (!profile) {
          // لو مسجل دخول بس ملوش بيانات في جدول User (حالة نادرة)
          router.push("/signup");
          return;
        }

        setUser(profile);
        await fetchPosts();
        await fetchChatUsers(authUser.id);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, supabase]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("Post")
      .select(`*, author:User(profileName, username, image)`)
      .order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchChatUsers = async (myId: string) => {
    const { data } = await supabase.from("User").select("*").not("id", "eq", myId);
    if (data) setChatUsers(data);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const { data } = await supabase
      .from("User")
      .select("*")
      .or(`username.ilike.%${searchTerm}%,profileName.ilike.%${searchTerm}%`);
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

  // شاشة التحميل (عشان تمنع الصفحة البيضاء)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-600 font-black animate-pulse">REDA CHAT...</p>
        </div>
      </div>
    );
  }

  // لو مفيش يوزر (لزيادة الأمان)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-5 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-emerald-600 italic tracking-tighter">REDA CHAT</h1>
        <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden shadow-sm border-2 border-white dark:border-slate-700">
            {user.image ? <img src={user.image} className="w-full h-full object-cover" alt="profile" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.profileName?.[0] || "?"}</div>}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
          
          {/* تابة الرئيسية - البوستات */}
          {activeTab === "home" && (
             <div className="space-y-4">
               <div className="bg-white dark:bg-slate-900 rounded-[25px] p-4 shadow-sm border dark:border-slate-800">
                  <textarea 
                    value={newPost} 
                    onChange={e => setNewPost(e.target.value)} 
                    placeholder={`بماذا تفكر يا ${user.profileName}؟`} 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none resize-none mb-3 dark:text-white border-none" 
                    rows={2} 
                  />
                  <div className="flex justify-end">
                    <button onClick={handlePost} className="bg-emerald-600 text-white px-8 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all">نشر</button>
                  </div>
               </div>

               {posts.map(post => (
                 <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[25px] p-5 shadow-sm border dark:border-slate-800 animate-in fade-in">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden flex items-center justify-center font-bold text-emerald-600">
                           {post.author?.image ? <img src={post.author.image} className="w-full h-full object-cover" alt="author" /> : (post.author?.profileName?.[0] || "?")}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4>
                          <p className="text-[10px] text-slate-400">@{post.author?.username}</p>
                        </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">{post.content}</p>
                 </div>
               ))}
             </div>
          )}

          {/* تابة البحث */}
          {activeTab === "friends" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                  placeholder="ابحث عن صديق..." 
                  className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-2xl outline-none shadow-sm dark:text-white border dark:border-slate-800" 
                />
                <button onClick={handleSearch} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold">بحث</button>
              </div>
              <div className="space-y-3">
                {searchResults.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center justify-between border dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-emerald-600">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-full" alt="user" /> : p.profileName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm dark:text-white">{p.profileName}</p>
                        <p className="text-[10px] text-slate-400">@{p.username}</p>
                      </div>
                    </div>
                    <button onClick={() => router.push(`/chat/${p.id}`)} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs">دردشة</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* تابة المحادثات */}
          {activeTab === "chat" && (
            <div className="space-y-2">
              <h2 className="text-xl font-black mb-4 dark:text-white px-2">المحادثات</h2>
              {chatUsers.map(u => (
                <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center gap-4 cursor-pointer border dark:border-slate-800 hover:scale-[1.02] transition-all">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden flex items-center justify-center font-bold text-emerald-600">
                      {u.image ? <img src={u.image} className="w-full h-full object-cover" alt="user" /> : u.profileName?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold dark:text-white">{u.profileName}</h4>
                    <p className="text-xs text-slate-400">اضغط لفتح المحادثة</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تابة البروفايل */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[35px] p-8 shadow-sm border dark:border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-emerald-600"></div>
                <div className="w-28 h-28 rounded-[35px] border-4 border-white dark:border-slate-900 bg-slate-100 mx-auto relative z-10 overflow-hidden mt-4 shadow-lg">
                  {user.image ? <img src={user.image} className="w-full h-full object-cover" alt="profile" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-emerald-600">{user.profileName?.[0]}</div>}
                </div>
                <h2 className="mt-4 text-2xl font-black dark:text-white">{user.profileName}</h2>
                <p className="text-emerald-500 font-bold mb-6">@{user.username}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">العمر</span>
                    <span className="font-black text-lg dark:text-white">{user.age || "--"}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">البلد</span>
                    <span className="font-black text-lg dark:text-white truncate">{user.country || "--"}</span>
                  </div>
                </div>

                <button 
                  onClick={async () => { await supabase.auth.signOut(); router.push("/signup"); }} 
                  className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t dark:border-slate-800 p-4 flex justify-around shadow-lg z-50">
        <NavBtn icon="🏠" label="الرئيسية" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavBtn icon="👥" label="الأصدقاء" active={activeTab === "friends"} onClick={() => setActiveTab("friends")} />
        <NavBtn icon="💬" label="الدردشة" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
        <NavBtn icon="👤" label="بروفايلي" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center transition-all ${active ? "text-emerald-600 scale-110 font-black" : "text-slate-400 opacity-60 hover:opacity-100"}`}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] tracking-tighter">{label}</span>
    </button>
  );
}