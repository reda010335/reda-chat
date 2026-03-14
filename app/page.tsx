"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const [form, setForm] = useState({
    username: "", // اليوزرنيم اللي بنستخدمه للدخول
    password: "",
    profileName: "",
    age: "",
    gender: "ذكر",
    country: ""
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // تحويل اليوزرنيم لإيميل وهمي عشان سوبابيز يقبله
    const fakeEmail = `${form.username.toLowerCase()}@redachat.com`;

    try {
      if (mode === "register") {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: form.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // حفظ البيانات في جدول User
          const { error: dbError } = await supabase.from("User").upsert([{
            id: authData.user.id,
            profileName: form.profileName,
            username: form.username.toLowerCase(),
            age: form.age ? parseInt(form.age) : null,
            gender: form.gender,
            country: form.country
          }]);
          
          if (dbError) throw dbError;
          
          alert("تم إنشاء الحساب بنجاح! جاري الدخول...");
          // تسجيل دخول تلقائي بعد التسجيل
          await supabase.auth.signInWithPassword({ email: fakeEmail, password: form.password });
          router.push("/"); 
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: form.password,
        });
        if (loginError) throw loginError;
        router.push("/");
      }
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-white text-center">
        <h1 className="text-4xl font-black text-emerald-600 mb-8 italic tracking-tighter">REDA CHAT</h1>
        
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button onClick={() => setMode("login")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>دخول</button>
          <button onClick={() => setMode("register")} className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>جديد</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {mode === "register" && (
            <>
              <input placeholder="الاسم اللي هيظهر للناس" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" onChange={e => setForm({...form, profileName: e.target.value})} required />
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
          
          {/* هنا غيرنا النوع لـ text عشان المتصفح ميسألش عن الـ @ */}
          <input 
            type="text" 
            placeholder="اسم المستخدم" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" 
            onChange={e => setForm({...form, username: e.target.value})} 
            required 
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" 
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
          />
          
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg mt-4 active:scale-95">
            {loading ? "لحظة..." : (mode === "register" ? "إنشاء حساب" : "تسجيل دخول")}
          </button>
        </form>
      </div>
    </div>
  );
}