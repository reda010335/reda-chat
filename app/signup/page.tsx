"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("register");

  const [form, setForm] = useState({
    email: "",
    password: "",
    profileName: "",
    username: "",
    age: "",
    gender: "ذكر",
    country: ""
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "register") {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) { alert(authError.message); setLoading(false); return; }

      if (authData.user) {
        await supabase.from("User").upsert([{
          id: authData.user.id,
          profileName: form.profileName,
          username: form.username,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender,
          country: form.country
        }]);
        router.push("/"); 
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) alert(error.message);
      else router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-white text-center">
        <h1 className="text-4xl font-black text-emerald-600 mb-8 italic tracking-tighter text-center">REDA CHAT</h1>
        
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
          <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {mode === "register" && (
            <>
              <input placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, profileName: e.target.value})} required />
              <input placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, username: e.target.value})} required />
              <div className="flex gap-2">
                <input type="number" placeholder="العمر" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, age: e.target.value})} />
                <select className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300 text-slate-500" onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
              <input placeholder="البلد" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, country: e.target.value})} />
            </>
          )}
          <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, password: e.target.value})} required />
          
          <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg mt-4">
            {loading ? "جاري العمل..." : (mode === "register" ? "إنشاء حساب" : "تسجيل دخول")}
          </button>
        </form>
      </div>
    </div>
  );
}