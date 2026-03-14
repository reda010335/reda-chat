"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type UserProfile = {
  id: string;
  username: string;
  profileName: string;
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

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");
    const fakeEmail = getFakeEmail(username);

    try {
      if (mode === "register") {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: password,
        });
        if (authError) throw authError;
        if (authData.user) {
          await supabase.from("User").upsert([{
            id: authData.user.id,
            username: username.trim().toLowerCase(),
            profileName: profileName.trim(),
          }]);
        }
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });
      if (loginError) throw loginError;

      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
        <div className="mx-auto max-w-md bg-white min-h-screen shadow-2xl relative">
          
          <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">REDA CHAT</h1>
            <div className="flex gap-4 items-center">
               <button onClick={() => router.push("/chat")} className="text-2xl relative">
                  💬
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"></span>
               </button>
               <div className="h-10 w-10 rounded-full bg-linear-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                {currentUser.profileName.charAt(0)}
               </div>
            </div>
          </header>

          {/* Stories - التعديلات تمت هنا */}
          <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b bg-slate-50/30">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-16 h-16 rounded-full bg-linear-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-white rounded-full p-0.5">
                    <div className="w-full h-full bg-slate-200 rounded-full" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">مستخدم {i}</span>
              </div>
            ))}
          </div>

          <div className="p-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">R</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Reda Chat</p>
                  <p className="text-[10px] text-slate-400">الآن</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                أهلاً بك يا <span className="text-emerald-600 font-bold">{currentUser.profileName}</span>. هيكل إنستجرام أصبح جاهزاً الآن!
              </p>
            </div>
          </div>

          <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 flex justify-around items-center bg-white border-t py-3 px-6 shadow-lg">
            <button onClick={() => router.push("/")} className="text-emerald-600 flex flex-col items-center">
              <span className="text-2xl">🏠</span>
              <span className="text-[10px] font-bold">الرئيسية</span>
            </button>
            <button onClick={() => router.push("/chat")} className="text-slate-400 flex flex-col items-center">
              <span className="text-2xl">💬</span>
              <span className="text-[10px] font-bold">الدردشات</span>
            </button>
            <button onClick={() => router.push("/profile")} className="text-slate-400 flex flex-col items-center">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-bold">بروفايلي</span>
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-[40px] bg-white p-10 shadow-2xl">
        <h1 className="text-4xl font-black text-center text-slate-900 mb-8 italic">REDA CHAT</h1>
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
          <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
          <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold text-sm transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
        </div>
        <div className="space-y-4">
          {mode === "register" && (
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="الاسم الكامل" className="w-full rounded-2xl bg-slate-50 p-4 outline-none focus:ring-2 ring-emerald-500" />
          )}
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full rounded-2xl bg-slate-50 p-4 outline-none focus:ring-2 ring-emerald-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl bg-slate-50 p-4 outline-none focus:ring-2 ring-emerald-500" />
          {message && <p className="text-center text-xs font-bold text-red-500">{message}</p>}
          <button onClick={handleAuth} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-4 text-white font-bold shadow-lg hover:bg-emerald-600 transition-all">
            {loading ? "لحظة..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </div>
      </div>
    </div>
  );
}