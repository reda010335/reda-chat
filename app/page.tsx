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
    { id: 1, author: "Reda Chat", time: "الآن", text: "أهلاً بك في النسخة المستقرة من REDA CHAT 🚀" }
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

  const getFakeEmail = (user: string) => `${user.trim().toLowerCase()}@redachat.com`;

  const handleRegister = async () => {
    if (!username || !password || !profileName) {
      setMessage("من فضلك املأ كل البيانات");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const cleanUsername = username.trim().toLowerCase();
      const fakeEmail = getFakeEmail(cleanUsername);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      });

      if (authError && authError.message.includes("already registered")) {
        return handleLogin(); 
      }

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase.from("User").upsert([
          {
            id: authData.user.id,
            username: cleanUsername,
            profileName: profileName.trim(),
          },
        ]);
        if (dbError) throw dbError;
        setMessage("تم إنشاء الحساب! جاري الدخول...");
        setTimeout(() => handleLogin(), 1000);
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

        if (dbError) {
          setCurrentUser({ id: authData.user.id, username: username, profileName: username });
        } else {
          setCurrentUser(profile);
        }
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

  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32 text-right" dir="rtl">
        <div className="mx-auto max-w-md bg-white min-h-screen shadow-2xl relative">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {currentUser.profileName ? currentUser.profileName.charAt(0) : "R"}
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 leading-none">REDA CHAT</h1>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">نشط الآن</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">خروج</button>
          </header>

          {/* Post Input */}
          <section className="p-4 bg-white border-b">
            <div className="flex items-center gap-3 bg-slate-100 rounded-2xl p-2">
               <input 
                 readOnly
                 placeholder={`بم تفكر يا ${currentUser.profileName}؟`} 
                 className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-right cursor-pointer" 
               />
               <button className="bg-emerald-500 text-white p-2 rounded-xl shadow-md">➕</button>
            </div>
          </section>

          {/* Feed */}
          <div className="p-4 space-y-4">
            {posts.map(post => (
              <div key={post.id} className="p-5 border border-slate-100 rounded-[24px] bg-white shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-800 text-sm">{post.author}</span>
                  <span className="text-[10px] text-slate-400">{post.time}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{post.text}</p>
              </div>
            ))}
          </div>
          
          {/* Stable Bottom Navigation */}
          <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t bg-white/95 backdrop-blur-xl py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <button className="flex flex-col items-center gap-1 text-emerald-600">
              <span className="text-2xl">🏠</span>
              <span className="text-[10px] font-black">الرئيسية</span>
            </button>
            <button 
              onClick={() => { if(window) window.location.href = "/chat"; }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500"
            >
              <span className="text-2xl">💬</span>
              <span className="text-[10px] font-black">الدردشات</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
              <span className="text-2xl">👥</span>
              <span className="text-[10px] font-black">الأصدقاء</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
              <span className="text-2xl">⚙️</span>
              <span className="text-[10px] font-black">الإعدادات</span>
            </button>
          </nav>
        </div>
      </div>
    );
  }

  // Auth UI (Login/Register) - No changes here as it's stable
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-[35px] bg-white p-10 shadow-2xl border border-white">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-2">REDA CHAT</h1>
            <div className="h-1.5 w-12 bg-emerald-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1.5">
          <button onClick={() => { setMode("login"); setMessage(""); }} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all ${mode === "login" ? "bg-white shadow-md text-emerald-600" : "text-slate-500"}`}>دخول</button>
          <button onClick={() => { setMode("register"); setMessage(""); }} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all ${mode === "register" ? "bg-white shadow-md text-emerald-600" : "text-slate-500"}`}>جديد</button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="الاسم الكامل" className="w-full rounded-2xl border-none bg-slate-50 p-4 text-right outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
          )}
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full rounded-2xl border-none bg-slate-50 p-4 text-right outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl border-none bg-slate-50 p-4 text-right outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
          
          {message && <div className={`p-4 text-xs text-center font-bold rounded-2xl ${message.includes("بنجاح") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{message}</div>}
          
          <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-4 text-white font-bold shadow-xl hover:bg-emerald-600 transition-all">
            {loading ? "لحظة..." : (mode === "login" ? "تسجيل دخول" : "إنشاء حساب")}
          </button>
        </div>
      </div>
    </div>
  );
}
