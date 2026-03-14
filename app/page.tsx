"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function RedaChatUltimate() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile" | "settings">("home");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", profileName: "" });
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // البحث والدردشة
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("User").select("*").eq("id", user.id).single();
        setUser(profile);
        fetchPosts();
        fetchChatUsers(user.id);
      }
      setIsAuthLoading(false);
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("Post").select(`*, author:User(profileName, username, image)`).order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchChatUsers = async (myId: string) => {
    const { data } = await supabase.from("User").select("*").not("id", "eq", myId);
    if (data) setChatUsers(data);
  };

  // --- وظيفة البحث الحقيقية ---
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .or(`username.ilike.%${searchTerm}%,profileName.ilike.%${searchTerm}%`);
    
    if (data) setSearchResults(data);
    if (error) console.error("Search error:", error);
    setLoading(false);
  };

  // --- وظيفة رفع الصورة ---
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      await supabase.from("User").update({ image: publicUrl }).eq("id", user.id);
      setUser({ ...user, image: publicUrl });
      alert("تم تحديث صورتك بنجاح! 🚀");
    } else {
        alert("فشل الرفع: تأكد من إعداد Storage في Supabase باسم images");
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setLoading(true);
    const email = `${form.username.toLowerCase()}@redachat.com`;
    try {
      if (mode === "register") {
        const { data } = await supabase.auth.signUp({ email, password: form.password });
        if (data.user) await supabase.from("User").upsert([{ id: data.user.id, username: form.username, profileName: form.profileName || form.username }]);
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (error) throw error;
      window.location.reload();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    await supabase.from("Post").insert([{ content: newPost, authorId: user.id }]);
    setNewPost("");
    fetchPosts();
    setLoading(false);
  };

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-600 animate-pulse">REDA CHAT...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-white text-center">
          <h1 className="text-4xl font-black text-emerald-600 mb-8 italic tracking-tighter">REDA CHAT</h1>
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
            <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
          </div>
          <div className="space-y-4">
            {mode === "register" && <input placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-emerald-300 transition-all" onChange={e => setForm({...form, profileName: e.target.value})} />}
            <input placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-emerald-300 transition-all" onChange={e => setForm({...form, username: e.target.value})} />
            <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-emerald-300 transition-all" onChange={e => setForm({...form, password: e.target.value})} />
            <button onClick={handleAuth} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg">{loading ? "لحظة..." : "ابدأ الآن"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b px-5 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden shadow-sm border-2 border-white">
            {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.profileName[0]}</div>}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {activeTab === "home" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={`بماذا تفكر يا ${user.profileName}؟`} className="w-full bg-slate-50 rounded-2xl p-4 text-sm outline-none resize-none mb-3" rows={2} />
              <div className="flex justify-end"><button onClick={handlePost} disabled={loading} className="bg-emerald-600 text-white px-8 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all">{loading ? "..." : "نشر"}</button></div>
            </div>
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center font-bold text-emerald-600">
                    {post.author?.image ? <img src={post.author.image} className="w-full h-full object-cover" /> : post.author?.profileName?.[0]}
                  </div>
                  <div><h4 className="font-bold text-sm">{post.author?.profileName}</h4><p className="text-[10px] text-slate-400">@{post.author?.username}</p></div>
                </div>
                <p className="text-slate-700 text-sm mb-4 leading-relaxed">{post.content}</p>
                <div className="flex justify-around border-t pt-3 text-slate-400 text-xs font-bold">
                  <button className="hover:text-emerald-600 transition-colors">👍 إعجاب</button>
                  <button className="hover:text-emerald-600 transition-colors">💬 تعليق</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">البحث عن أصدقاء</h2>
            <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="اكتب الاسم أو اليوزرنيم..." className="flex-1 p-4 bg-white rounded-2xl outline-none shadow-sm border border-slate-100 focus:border-emerald-300" />
              <button onClick={handleSearch} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold shadow-md">{loading ? "..." : "بحث"}</button>
            </div>
            <div className="space-y-3">
              {searchResults.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-emerald-600 border border-emerald-50">
                      {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : p.profileName[0]}
                    </div>
                    <div><p className="font-bold text-sm text-slate-800">{p.profileName}</p><p className="text-[10px] text-slate-400">@{p.username}</p></div>
                  </div>
                  <button onClick={() => router.push(`/chat/${p.id}`)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs">دردشة</button>
                </div>
              ))}
              {searchResults.length === 0 && !loading && searchTerm !== "" && <p className="text-center text-slate-400 text-sm py-10">لم يتم العثور على نتائج</p>}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-2">
            <h2 className="text-xl font-bold mb-4 text-slate-800">المحادثات</h2>
            {chatUsers.map(u => (
              <div key={u.id} onClick={() => router.push(`/chat/${u.id}`)} className="bg-white p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50 transition-all border border-slate-50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center font-bold text-emerald-600 border border-emerald-50">
                    {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : u.profileName[0]}
                </div>
                <div><h4 className="font-bold text-slate-800">{u.profileName}</h4><p className="text-xs text-slate-400 tracking-tight">اضغط لبدء الدردشة الآن</p></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 text-center">
            {/* التعديل هنا: bg-linear-to-r */}
            <div className="h-36 bg-linear-to-r from-emerald-500 to-teal-600 rounded-[35px] relative shadow-inner">
               <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-white rounded-full p-1 shadow-xl group relative overflow-hidden">
                  <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-4xl font-black text-emerald-600 border border-emerald-50">
                    {user.image ? <img src={user.image} className="w-full h-full object-cover rounded-full" /> : user.profileName[0]}
                  </div>
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-[2px]">
                    <span className="text-white text-xs font-bold">تغيير الصورة</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} />
                  </label>
               </div>
            </div>
            <div className="pt-10">
              <h2 className="text-2xl font-black text-slate-800">{user.profileName}</h2>
              <p className="text-slate-400 font-bold tracking-wide">@{user.username}</p>
              <div className="flex justify-center gap-6 mt-8">
                <div className="bg-white p-5 rounded-3xl shadow-sm flex-1 border border-slate-100">
                  <p className="text-emerald-600 font-black text-2xl tracking-tighter">0</p><p className="text-[10px] text-slate-400 font-bold uppercase">أصدقاء</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm flex-1 border border-slate-100">
                  <p className="text-emerald-600 font-black text-2xl tracking-tighter">{posts.filter(p => p.authorId === user.id).length}</p><p className="text-[10px] text-slate-400 font-bold uppercase">منشورات</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 space-y-4">
             <button className="w-full text-right p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 text-sm">تعديل الملف الشخصي</button>
             <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full text-right p-4 bg-red-50 rounded-2xl font-bold text-red-500 text-sm">تسجيل الخروج</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-4 flex justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center transition-transform ${activeTab === "home" ? "text-emerald-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><span className="text-2xl">🏠</span><span className="text-[10px] font-bold mt-1">الرئيسية</span></button>
        <button onClick={() => setActiveTab("friends")} className={`flex flex-col items-center transition-transform ${activeTab === "friends" ? "text-emerald-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><span className="text-2xl">👥</span><span className="text-[10px] font-bold mt-1">الأصدقاء</span></button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center transition-transform ${activeTab === "chat" ? "text-emerald-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><span className="text-2xl">💬</span><span className="text-[10px] font-bold mt-1">الدردشة</span></button>
        <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center transition-transform ${activeTab === "profile" ? "text-emerald-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><span className="text-2xl">👤</span><span className="text-[10px] font-bold mt-1">بروفايلي</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center transition-transform ${activeTab === "settings" ? "text-emerald-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><span className="text-2xl">⚙️</span><span className="text-[10px] font-bold mt-1">الإعدادات</span></button>
      </nav>
    </div>
  );
}