"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type UserProfile = {
  id: string;
  username: string;
  profileName: string;
  createdAt?: string;
};

type Post = {
  id: number;
  author: string;
  time: string;
  text: string;
};

export default function Home() {
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [posts] = useState<Post[]>([
    { id: 1, author: "Ahmed Ali", time: "منذ 5 دقائق", text: "أول منشور في REDA CHAT 🔥" }
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("User")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) setCurrentUser(profile);
      }
    };
    checkUser();
  }, [supabase]);

  // دالة موحدة لإنشاء الإيميل الوهمي من اليوزر نيم
  const getFakeEmail = (user: string) => `${user.trim().toLowerCase()}@redachat.com`;

  const handleRegister = async () => {
    if (!username || !password || !profileName) {
      setMessage("من فضلك املأ كل البيانات");
      return;
    }
    try {
      setLoading(true);
      setMessage("");

      const fakeEmail = getFakeEmail(username);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase.from("User").insert([
          {
            id: authData.user.id,
            username: username.trim().toLowerCase(),
            profileName: profileName.trim(),
          },
        ]);

        if (dbError) {
          console.error("Database Error:", dbError);
          if (dbError.message.includes("permission denied")) {
            throw new Error("مشكلة في صلاحيات قاعدة البيانات.. تأكد من تشغيل كود الـ SQL في Supabase");
          }
          throw dbError;
        }
        
        setMessage("تم إنشاء الحساب بنجاح! سجل دخولك الآن");
        setMode("login");
      }
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("اكتب اسم المستخدم وكلمة المرور");
      return;
    }
    try {
      setLoading(true);
      setMessage("");

      const fakeEmail = getFakeEmail(username);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: dbError } = await supabase
          .from("User")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (dbError) throw new Error("لم نتمكن من العثور على بروفايلك في قاعدة البيانات");
        setCurrentUser(profile);
      }
    } catch (err: any) {
      setMessage(err.message === "Invalid login credentials" ? "بيانات الدخول غير صحيحة" : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMode("login");
    setUsername("");
    setPassword("");
  };

  // واجهة المستخدم بعد الدخول
  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 pb-24 text-right" dir="rtl">
        <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl relative">
          <header className="sticky top-0 z-20 border-b bg-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {currentUser.profileName.charAt(0)}
              </div>
              <div className="text-right">
                <h1 className="text-xl font-extrabold text-slate-900 leading-none">REDA CHAT</h1>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">متصل الآن</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 font-bold border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">خروج</button>
          </header>

          <section className="p-4 border-b bg-white">
            <div className="flex items-center gap-3">
               <input placeholder={`بم تفكر يا ${currentUser.profileName.split(' ')[0]}؟`} className="flex-1 rounded-full bg-slate-100 px-4 py-3 outline-none text-right text-sm focus:ring-2 focus:ring-emerald-100" />
            </div>
          </section>

          <div className="p-4 space-y-4">
            {posts.map(post => (
              <div key={post.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-emerald-600 text-sm">{post.author}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{post.time}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{post.text}</p>
              </div>
            ))}
          </div>
          
          <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t bg-white/80 backdrop-blur-md py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button className="flex flex-col items-center gap-1 text-emerald-600 transition-colors">
              <span className="text-xl">🏠</span>
              <span className="text-[10px] font-black">الرئيسية</span>
            </button>
            <button onClick={() => router.push("/chat")} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500 transition-colors">
              <span className="text-xl">💬</span>
              <span className="text-[10px] font-black">الدردشات</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500 transition-colors">
              <span className="text-xl">👥</span>
              <span className="text-[10px] font-black">الأصدقاء</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500 transition-colors">
              <span className="text-xl">⚙️</span>
              <span className="text-[10px] font-black">الإعدادات</span>
            </button>
          </nav>
        </div>
      </div>
    );
  }

  // واجهة تسجيل الدخول
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans" dir="rtl">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">REDA CHAT</h1>
            <p className="text-slate-400 text-sm font-medium">تواصل بذكاء وأمان</p>
        </div>
        
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1.5">
          <button onClick={() => { setMode("login"); setMessage(""); }} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${mode === "login" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>تسجيل دخول</button>
          <button onClick={() => { setMode("register"); setMessage(""); }} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${mode === "register" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>حساب جديد</button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 mr-2">الاسم بالكامل</label>
              <input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                placeholder="رضا علي" 
                className="w-full rounded-2xl border border-slate-200 p-4 text-right outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" 
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 mr-2">اسم المستخدم (Username)</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="reda123" 
              className="w-full rounded-2xl border border-slate-200 p-4 text-right outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 mr-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full rounded-2xl border border-slate-200 p-4 text-right outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" 
            />
          </div>
          
          {message && (
            <div className={`p-4 text-xs text-center font-bold rounded-2xl border animate-pulse ${message.includes("بنجاح") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"}`}>
              {message}
            </div>
          )}
          
          <button 
            onClick={mode === "login" ? handleLogin : handleRegister} 
            disabled={loading} 
            className="w-full rounded-2xl bg-emerald-500 py-4 mt-4 text-white font-bold shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                جاري التحميل...
              </span>
            ) : (mode === "login" ? "دخول آمن" : "بدء الرحلة الآن")}
          </button>
        </div>
      </div>
    </div>
  );
}