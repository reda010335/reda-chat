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
    if (!username || !password) {
      setMessage("اكتب البيانات الأول يا بطل");
      return;
    }
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
            profileName: profileName.trim() || username,
          }]);
        }
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });
      if (loginError) throw loginError;

      // الدخول الفوري
      window.location.replace('/'); 
    } catch (err: any) {
      setMessage(err.message === "Invalid login credentials" ? "بيانات الدخول غلط" : err.message);
    } finally {
      setLoading(false);
    }
  };

  // واجهة الموقع من الداخل (لو مسجل دخول)
  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center" dir="rtl">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col">
          
          <header className="p-6 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <h1 className="text-2xl font-black text-emerald-600 italic">REDA CHAT</h1>
            <button 
              onClick={async () => { await supabase.auth.signOut(); window.location.replace('/'); }}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 transition-colors"
            >🚪</button>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[32px] p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">يا هلا، {currentUser.profileName}!</h2>
              <p className="opacity-90 text-sm leading-relaxed">
                دلوقتي أنت متصل بالداتا بيز. جرب تبحث عن أصحابك أو تدخل الدردشات.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => router.push("/search")} className="p-6 bg-white border border-slate-100 rounded-3xl text-right hover:shadow-md transition-all">
                <span className="text-3xl block mb-3">🔍</span>
                <span className="font-bold text-slate-800">البحث</span>
              </button>
              <button onClick={() => router.push("/chat")} className="p-6 bg-white border border-slate-100 rounded-3xl text-right hover:shadow-md transition-all">
                <span className="text-3xl block mb-3">💬</span>
                <span className="font-bold text-slate-800">الدردشات</span>
              </button>
            </div>
          </main>

          <nav className="p-4 bg-white border-t flex justify-around items-center sticky bottom-0">
            <button className="text-emerald-600 text-2xl">🏠</button>
            <button onClick={() => router.push("/search")} className="text-slate-300 text-2xl">🔍</button>
            <button onClick={() => router.push("/chat")} className="text-slate-300 text-2xl">💬</button>
            <button onClick={() => router.push("/profile")} className="text-slate-300 text-2xl">👤</button>
          </nav>

        </div>
      </div>
    );
  }

  // واجهة تسجيل الدخول
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-[45px] bg-white p-10 shadow-2xl border border-white">
        <h1 className="text-4xl font-black text-center text-slate-900 mb-10 italic tracking-tighter">REDA CHAT</h1>
        
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1.5">
          <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400"}`}>دخول</button>
          <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400"}`}>جديد</button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="اسمك الكامل" className="w-full rounded-2xl bg-slate-50 p-4 border-none outline-none focus:ring-2 ring-emerald-500 transition-all" />
          )}
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full rounded-2xl bg-slate-50 p-4 border-none outline-none focus:ring-2 ring-emerald-500 transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl bg-slate-50 p-4 border-none outline-none focus:ring-2 ring-emerald-500 transition-all" />
          
          {message && <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold text-center">{message}</div>}
          
          <button onClick={handleAuth} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-4 text-white font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all">
            {loading ? "لحظة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب مجاني"}
          </button>
        </div>
      </div>
    </div>
  );
}