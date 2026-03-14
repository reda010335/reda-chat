"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// --- التعريفات ---
type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: { profileName: string; username: string };
};

export default function RedaChatApp() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", profileName: "" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- التأكد من حالة الدخول وجلب البيانات ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("User").select("*").eq("id", user.id).single();
        setUser(profile);
        fetchPosts();
      }
      setIsAuthLoading(false);
    };
    checkUser();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("Post")
      .select(`*, author:User(profileName, username)`)
      .order("createdAt", { ascending: false });
    if (data) setPosts(data);
  };

  // --- وظائف التسجيل والدخول ---
  const handleAuth = async () => {
    if (!form.username || !form.password) return setErrorMsg("كمل البيانات يا رضا");
    setIsPosting(true);
    setErrorMsg("");
    const email = `${form.username.toLowerCase()}@redachat.com`;

    try {
      if (mode === "register") {
        const { data: authData, error: ae } = await supabase.auth.signUp({ email, password: form.password });
        if (ae) throw ae;
        if (authData.user) {
          await supabase.from("User").upsert([{ 
            id: authData.user.id, 
            username: form.username, 
            profileName: form.profileName || form.username 
          }]);
        }
      }
      const { error: le } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (le) throw le;
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  // --- وظيفة نشر بوست ---
  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    const { error } = await supabase.from("Post").insert([{ content: newPost, authorId: user.id }]);
    if (!error) {
      setNewPost("");
      fetchPosts();
    }
    setIsPosting(false);
  };

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center font-bold">جاري التحميل...</div>;

  // --- 1. شاشة تسجيل الدخول (لو مش داخل) ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl">
          <h1 className="text-4xl font-black text-center text-emerald-600 mb-8 italic">REDA CHAT</h1>
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
            <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
          </div>
          <div className="space-y-4">
            {mode === "register" && (
              <input placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-emerald-500" onChange={e => setForm({...form, profileName: e.target.value})} />
            )}
            <input placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-emerald-500" onChange={e => setForm({...form, username: e.target.value})} />
            <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-emerald-500" onChange={e => setForm({...form, password: e.target.value})} />
            {errorMsg && <p className="text-red-500 text-xs text-center font-bold">{errorMsg}</p>}
            <button onClick={handleAuth} disabled={isPosting} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all">
              {isPosting ? "لحظة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. شاشة الفيسبوك (الرئيسية) ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-500">خروج</button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* مربع النشر */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">{user.profileName[0]}</div>
            <textarea 
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder={`بماذا تفكر يا ${user.profileName}؟`}
              className="w-full bg-slate-50 rounded-2xl p-3 text-sm outline-none resize-none"
              rows={2}
            />
          </div>
          <div className="flex justify-end mt-3 border-t pt-2">
            <button onClick={handleCreatePost} disabled={isPosting} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm">
              {isPosting ? "نشر..." : "نشر"}
            </button>
          </div>
        </div>

        {/* قائمة المنشورات */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">{post.author?.profileName[0]}</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{post.author?.profileName}</h4>
                  <p className="text-[10px] text-slate-400">@{post.author?.username}</p>
                </div>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">{post.content}</p>
              <div className="flex justify-around border-t pt-3 text-slate-400 text-xs font-bold">
                <button className="hover:text-emerald-600">👍 إعجاب</button>
                <button className="hover:text-emerald-600">💬 تعليق</button>
                <button className="hover:text-emerald-600">↗️ مشاركة</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Navigation Bar السفلي */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around shadow-lg">
        <button className="flex flex-col items-center text-emerald-600"><span className="text-xl">🏠</span><span className="text-[10px] font-bold">الرئيسية</span></button>
        <button className="flex flex-col items-center text-slate-300"><span className="text-xl">👥</span><span className="text-[10px] font-bold">الأصدقاء</span></button>
        <button className="flex flex-col items-center text-slate-300"><span className="text-xl">💬</span><span className="text-[10px] font-bold">الدردشة</span></button>
        <button className="flex flex-col items-center text-slate-300"><span className="text-xl">⚙️</span><span className="text-[10px] font-bold">الإعدادات</span></button>
      </nav>
    </div>
  );
}