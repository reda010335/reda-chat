"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const init = async () => {
      // استخدام getSession أسرع بكتير وبيمنع الـ 406
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.replace("/signup");
        return;
      }

      const { data: profile } = await supabase.from("User").select("*").eq("id", session.user.id).maybeSingle();
      
      if (!profile) {
        window.location.replace("/signup");
        return;
      }

      setUser(profile);
      fetchPosts();
      fetchChatUsers(session.user.id);
      checkNotifications(session.user.id);
      setLoading(false);

      // تفعيل الإشعارات اللحظية
      const channel = supabase
        .channel('realtime-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Notification', 
          filter: `receiverId=eq.${session.user.id}` 
        }, () => setHasNotifications(true))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("Post").select(`*, author:User(id, profileName, username, image)`).order("createdAt", { ascending: false });
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

  const handlePost = async (file?: File) => {
    if (!newPost.trim() && !file || !user) return;
    setUploading(true);
    let mediaUrl = null;
    let mediaType = "text";

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }

      const { error } = await supabase.from("Post").insert([{ 
        content: newPost, authorId: user.id, mediaUrl, mediaType
      }]);

      if (!error) { setNewPost(""); fetchPosts(); }
    } catch (err: any) { 
      alert("خطأ: تأكد من إعدادات الـ Storage في سوبابيز"); 
    } finally { setUploading(false); }
  };

  const handleFollow = async (targetId: string) => {
    if (targetId === user.id) return;
    const { error } = await supabase.from("Follow").insert([{ followerId: user.id, followingId: targetId }]);
    if (error) alert("متابع بالفعل");
    else {
        await supabase.from("Notification").insert([{ receiverId: targetId, senderId: user.id, type: "follow" }]);
        alert("تمت المتابعة ✅");
    }
  };

  const handleLike = async (postId: string, authorId: string) => {
    const { error } = await supabase.from("Like").upsert([{ userId: user.id, postId: postId }]);
    if (!error && user.id !== authorId) {
        await supabase.from("Notification").insert([{ receiverId: authorId, senderId: user.id, type: "like", postId }]);
    }
    fetchPosts();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl italic">REDA CHAT</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 px-5 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-black text-emerald-600 italic tracking-tighter">REDA CHAT</h1>
        <div className="flex items-center gap-4">
            <button className="relative text-xl" onClick={() => router.push('/notifications')}>
              🔔 {hasNotifications && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>}
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-emerald-100 overflow-hidden cursor-pointer" onClick={() => setActiveTab("profile")}>
              {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.profileName[0]}</div>}
            </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Stories */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center text-emerald-500 bg-white dark:bg-slate-900 font-bold text-xl cursor-pointer hover:bg-emerald-50">+</div>
                    <span className="text-[10px] dark:text-white font-bold">قصتك</span>
                </div>
                {chatUsers.map((u, i) => (
                    <div key={i} onClick={() => router.push(`/profile/${u.id}`)} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
                        <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5 bg-gradient-to-tr from-emerald-400 to-emerald-600">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-900">
                                {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : <div className="text-center mt-3 font-bold text-xs">{u.profileName[0]}</div>}
                            </div>
                        </div>
                        <span className="text-[10px] dark:text-white">{u.profileName.split(' ')[0]}</span>
                    </div>
                ))}
            </div>

            {/* Post Box */}
            <div className="bg-white dark:bg-slate-900 rounded-[30px] p-5 shadow-sm border dark:border-slate-800">
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={`إيه الجديد يا ${user.profileName}؟`} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none resize-none dark:text-white" rows={2} />
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="text-2xl hover:bg-slate-100 p-2 rounded-full transition-all">🖼️</button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handlePost(e.target.files[0])} />
                </div>
                <button onClick={() => handlePost()} disabled={uploading || (!newPost.trim())} className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-black text-sm shadow-lg disabled:opacity-50">
                    {uploading ? "جاري..." : "نشر"}
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[30px] overflow-hidden shadow-sm border dark:border-slate-800 transition-all">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${post.authorId}`)}>
                    <div className="w-11 h-11 rounded-full bg-emerald-50 overflow-hidden flex items-center justify-center font-bold text-emerald-600 border border-emerald-100">
                      {post.author?.image ? <img src={post.author.image} className="w-full h-full object-cover" /> : post.author?.profileName?.[0]}
                    </div>
                    <div><h4 className="font-bold text-sm dark:text-white">{post.author?.profileName}</h4><p className="text-[10px] text-slate-400">@{post.author?.username}</p></div>
                  </div>
                  {post.authorId !== user.id && (
                    <button onClick={() => handleFollow(post.authorId)} className="text-[11px] text-emerald-600 font-black px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">متابعة</button>
                  )}
                </div>

                {post.content && <p className="px-6 pb-4 text-sm leading-relaxed dark:text-slate-300">{post.content}</p>}
                
                {post.mediaUrl && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {post.mediaType === 'video' ? <video src={post.mediaUrl} controls className="w-full max-h-[450px]" /> : <img src={post.mediaUrl} className="w-full object-contain max-h-[450px]" />}
                    </div>
                )}

                <div className="p-4 flex gap-8 border-t dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <button onClick={() => handleLike(post.id, post.authorId)} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-red-500">❤️ لايك</button>
                  <button className="flex items-center gap-2 text-xs font-black text-slate-500">💬 تعليق</button>
                  <button className="flex items-center gap-2 text-xs font-black text-slate-500">🔄 مشاركة</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* باقي التابات (Friends, Chat, Profile) تظل كما هي مع تحسينات التنسيق */}
        {activeTab === "friends" && (
           <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl flex gap-2 shadow-sm border dark:border-slate-800">
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث باسم المستخدم..." className="flex-1 p-3 bg-transparent outline-none dark:text-white text-sm" />
                <button onClick={async () => {
                  const { data } = await supabase.from("User").select("*").or(`username.ilike.%${searchTerm}%,profileName.ilike.%${searchTerm}%`);
                  if (data) setSearchResults(data);
                }} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm">بحث</button>
              </div>
              {searchResults.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center justify-between border dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${p.id}`)}>
                     <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-emerald-600 border">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : p.profileName[0]}
                     </div>
                     <div><p className="font-bold text-sm dark:text-white">{p.profileName}</p><p className="text-[10px] text-slate-400">@{p.username}</p></div>
                  </div>
                  <button onClick={() => handleFollow(p.id)} className="bg-emerald-600 text-white px-5 py-2 rounded-2xl font-bold text-[11px]">متابعة</button>
                </div>
              ))}
           </div>
        )}

        {/* ... (Chat Tab) ... */}
        {activeTab === "chat" && (
           <div className="space-y-3">
             <h2 className="text-xl font-black mb-4 dark:text-white px-2 italic">الرسائل</h2>
             {chatUsers.map(u => (
               <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center gap-4 border dark:border-slate-800 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform">
                 <div className="w-14 h-14 rounded-full bg-emerald-50 overflow-hidden flex items-center justify-center font-bold text-emerald-600 border">
                   {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : u.profileName[0]}
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold dark:text-white text-sm">{u.profileName}</h4>
                    <p className="text-xs text-slate-400">نشط الآن</p>
                 </div>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
               </div>
             ))}
           </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-emerald-600/10"></div>
                <div className="w-32 h-32 rounded-[40px] border-4 border-white dark:border-slate-900 bg-slate-100 mx-auto relative z-10 overflow-hidden shadow-xl">
                  {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-emerald-600">{user.profileName[0]}</div>}
                </div>
                <div className="text-center mt-6">
                  <h2 className="text-2xl font-black dark:text-white">{user.profileName}</h2>
                  <p className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 inline-block px-4 py-1 rounded-full text-xs mt-2">@{user.username}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] mb-1">العمر</span>
                    <span className="font-black dark:text-white">{user.age || "20"} سنة</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] mb-1">البلد</span>
                    <span className="font-black dark:text-white">{user.country || "مصر"}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button onClick={() => router.push('/edit-profile')} className="w-full p-4 bg-emerald-600 text-white rounded-[20px] font-black text-sm shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all">تعديل البروفايل</button>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.replace("/signup"); }} className="w-full p-4 bg-red-50 text-red-500 rounded-[20px] font-black text-sm active:scale-95 transition-all">تسجيل الخروج</button>
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t dark:border-slate-800 p-4 flex justify-around shadow-[0_-5px_30px_rgba(0,0,0,0.08)] z-50">
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