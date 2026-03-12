"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// التعريفات البرمجية
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
  
  // إعداد اتصال Supabase بالطريقة الجديدة (SSR)
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

  // بيانات تجريبية (سيتم جلبها لاحقاً من الداتابيز)
  const [stories] = useState([{ id: 1, name: "أحمد" }, { id: 2, name: "سارة" }]);
  const [posts] = useState<Post[]>([
    { id: 1, author: "Ahmed Ali", time: "منذ 5 دقائق", text: "أول منشور في REDA CHAT 🔥" }
  ]);

  // التحقق من حالة المستخدم عند تشغيل التطبيق
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

  const handleRegister = async () => {
    if (!username || !password || !profileName) {
      setMessage("من فضلك املأ كل البيانات");
      return;
    }
    try {
      setLoading(true);
      setMessage("");

      // 1. إنشاء الحساب في Auth
      const email = `${username.trim().toLowerCase()}@redachat.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. ربط بيانات البروفايل بالـ UUID في جدول User
        const { error: dbError } = await supabase.from("User").insert([
          {
            id: authData.user.id,
            username: username,
            profileName: profileName,
          },
        ]);

        if (dbError) throw dbError;
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

      const email = `${username.trim().toLowerCase()}@redachat.com`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: dbError } = await supabase
          .from("User")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (dbError) throw dbError;
        setCurrentUser(profile);
      }
    } catch (err: any) {
      setMessage("بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMode("login");
  };

  // واجهة المستخدم بعد تسجيل الدخول
  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 pb-24 text-right" dir="rtl">
        <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">
          <header className="sticky top-0 z-20 border-b bg-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                {currentUser.profileName.charAt(0)}
              </div>
              <div className="text-right">
                <h1 className="text-xl font-extrabold text-slate-900">REDA CHAT</h1>
                <p className="text-xs text-slate-500">أهلاً {currentUser.profileName}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-500 font-bold border border-red-100 rounded-lg px-2 py-1">خروج</button>
          </header>

          <section className="p-4 border-b bg-white">
            <div className="flex items-center gap-3">
               <input placeholder="بم تفكر؟" className="flex-1 rounded-full bg-slate-100 px-4 py-3 outline-none text-right" />
            </div>
          </section>

          {/* المنشورات والستوري تظهر هنا */}
          <div className="p-4 text-center text-slate-400">
             مرحباً بك في واجهتك الجديدة المتصلة بـ Supabase 🚀
          </div>
          
          <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t bg-white py-3 shadow-2xl">
            <button className="flex flex-col items-center gap-1 text-emerald-600"><span>🏠</span><span className="text-xs font-bold">الرئيسية</span></button>
            <button onClick={() => router.push("/chat")} className="flex flex-col items-center gap-1 text-slate-500"><span>💬</span><span className="text-xs font-bold">الدردشات</span></button>
            <button className="flex flex-col items-center gap-1 text-slate-500"><span>👥</span><span className="text-xs font-bold">الأصدقاء</span></button>
            <button className="flex flex-col items-center gap-1 text-slate-500"><span>⚙️</span><span className="text-xs font-bold">الإعدادات</span></button>
          </nav>
        </div>
      </div>
    );
  }

  // واجهة تسجيل الدخول
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2">REDA CHAT</h1>
            <p className="text-slate-500 text-sm">تواصل بذكاء وأمان</p>
        </div>
        
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
          <button onClick={() => { setMode("login"); setMessage(""); }} className={`w-1/2 py-3 rounded-2xl font-bold transition ${mode === "login" ? "bg-white shadow" : "text-slate-500"}`}>تسجيل دخول</button>
          <button onClick={() => { setMode("register"); setMessage(""); }} className={`w-1/2 py-3 rounded-2xl font-bold transition ${mode === "register" ? "bg-white shadow" : "text-slate-500"}`}>حساب جديد</button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="الاسم الظاهر (مثلاً: رضا علي)" className="w-full rounded-2xl border p-3 text-right outline-none focus:border-emerald-500 transition-all" />
          )}
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full rounded-2xl border p-3 text-right outline-none focus:border-emerald-500 transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl border p-3 text-right outline-none focus:border-emerald-500 transition-all" />
          
          {message && <div className="p-3 bg-red-50 text-red-500 text-xs text-center font-bold rounded-xl border border-red-100">{message}</div>}
          
          <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-4 text-white font-bold shadow-lg hover:bg-emerald-600 disabled:opacity-50 transition-all">
            {loading ? "جاري التحميل..." : (mode === "login" ? "دخول" : "إنشاء حساب")}
          </button>
        </div>
      </div>
    </div>
  );
}