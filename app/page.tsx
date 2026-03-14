"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function RedaChatFullApp() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "chat" | "profile" | "settings">("home");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", profileName: "" });
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // --- التحقق من المستخدم وجلب البيانات ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("User").select("*").eq("id", user.id).single();
        setUser(profile);
        fetchPosts();
      }
      setIsAuthLoading(false);
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("Post").select(`*, author:User(profileName, username)`).order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  const handleAuth = async () => {
    setLoading(true);
    const email = `${form.username.toLowerCase()}@redachat.com`;
    try {
      if (mode === "register") {
        const { data } = await supabase.auth.signUp({ email, password: form.password });
        if (data.user) await supabase.from("User").upsert([{ id: data.user.id, username: form.username, profileName: form.profileName || form.username }]);
      }
      await supabase.auth.signInWithPassword({ email, password: form.password });
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

  // --- شاشة الدخول ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-white">
          <h1 className="text-4xl font-black text-center text-emerald-600 mb-8 italic">REDA CHAT</h1>
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
            <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
          </div>
          <div className="space-y-4">
            {mode === "register" && <input placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setForm({...form, profileName: e.target.value})} />}
            <input placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setForm({...form, username: e.target.value})} />
            <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setForm({...form, password: e.target.value})} />
            <button onClick={handleAuth} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg">{loading ? "لحظة..." : "ابدأ الآن"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      {/* Header الثابت */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b px-5 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <div className="flex gap-3">
          <button className="text-xl">🔔</button>
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">{user.profileName[0]}</div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* --- 1. الصفحة الرئيسية (المنشورات) --- */}
        {activeTab === "home" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={`بماذا تفكر يا ${user.profileName}؟`} className="w-full bg-slate-50 rounded-2xl p-4 text-sm outline-none resize-none mb-3" rows={2} />
              <div className="flex justify-end"><button onClick={handlePost} disabled={loading} className="bg-emerald-600 text-white px-8 py-2 rounded-full font-bold text-sm shadow-md">{loading ? "..." : "نشر"}</button></div>
            </div>
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">{post.author?.profileName[0]}</div>
                  <div><h4 className="font-bold text-sm">{post.author?.profileName}</h4><p className="text-[10px] text-slate-400">@{post.author?.username}</p></div>
                </div>
                <p className="text-slate-700 text-sm mb-4 leading-relaxed">{post.content}</p>
                <div className="flex justify-around border-t pt-3 text-slate-400 text-xs font-bold">
                  <button className="hover:text-emerald-600">👍 إعجاب</button>
                  <button className="hover:text-emerald-600">💬 تعليق</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- 2. صفحة الأصدقاء --- */}
        {activeTab === "friends" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">اكتشف أشخاصاً جدد</h2>
            <div className="bg-white rounded-3xl p-5 shadow-sm text-center border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">🔍</div>
              <p className="text-sm text-slate-500 mb-4">ابحث عن أصدقائك بالاسم</p>
              <input placeholder="اكتب اسم المستخدم..." className="w-full p-3 bg-slate-50 rounded-xl outline-none text-center text-sm border border-slate-100" />
            </div>
          </div>
        )}

        {/* --- 3. صفحة الدردشة --- */}
        {activeTab === "chat" && (
          <div className="space-y-4 text-center py-10">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold">رسائلك الخاصة</h2>
            <p className="text-slate-400 text-sm">لا توجد محادثات حالياً. ابدأ دردشة مع أصدقائك!</p>
            <button onClick={() => setActiveTab("friends")} className="bg-emerald-600 text-white px-6 py-2 rounded-full mt-4 text-sm font-bold shadow-lg">البحث عن أصدقاء</button>
          </div>
        )}

        {/* --- 4. صفحة البروفايل --- */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="relative h-32 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-3xl shadow-lg">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1 shadow-xl">
                <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-3xl font-black text-emerald-600">{user.profileName[0]}</div>
              </div>
            </div>
            <div className="text-center mt-12">
              <h2 className="text-2xl font-black text-slate-800">{user.profileName}</h2>
              <p className="text-slate-400 font-bold">@{user.username}</p>
              <div className="flex justify-center gap-8 mt-6">
                <div className="text-center"><p className="font-black text-emerald-600">0</p><p className="text-xs text-slate-400">أصدقاء</p></div>
                <div className="text-center"><p className="font-black text-emerald-600">{posts.filter(p => p.authorId === user.id).length}</p><p className="text-xs text-slate-400">منشورات</p></div>
              </div>
            </div>
          </div>
        )}

        {/* --- 5. الإعدادات --- */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4 border border-slate-100">
             <button className="w-full text-right p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-700">⚙️ إعدادات الحساب</button>
             <button className="w-full text-right p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-700">🔒 الخصوصية والأمان</button>
             <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full text-right p-4 bg-red-50 rounded-2xl font-bold text-sm text-red-500">🚪 تسجيل الخروج</button>
          </div>
        )}
      </main>

      {/* Navigation Bar السفلي الاحترافي */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t p-3 flex justify-around shadow-2xl z-50">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center transition-all ${activeTab === "home" ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
          <span className="text-2xl">🏠</span><span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button onClick={() => setActiveTab("friends")} className={`flex flex-col items-center transition-all ${activeTab === "friends" ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
          <span className="text-2xl">👥</span><span className="text-[10px] font-bold">الأصدقاء</span>
        </button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center transition-all ${activeTab === "chat" ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
          <span className="text-2xl">💬</span><span className="text-[10px] font-bold">الدردشة</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center transition-all ${activeTab === "profile" ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
          <span className="text-2xl">👤</span><span className="text-[10px] font-bold">بروفايلي</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center transition-all ${activeTab === "settings" ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold">الإعدادات</span>
        </button>
      </nav>
    </div>
  );
}