"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    username: "",
    password: "",
    profileName: "",
    age: "",
    gender: "ذكر",
    country: ""
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // تحويل اليوزرنيم لإيميل داخلي عشان سوبابيز يقبله كـ Auth
    const internalEmail = `${form.username.trim().toLowerCase()}@redachat.com`;

    try {
      if (mode === "register") {
        // 1. إنشاء الحساب في Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: internalEmail,
          password: form.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. إدخال بيانات المستخدم في جدول User
          const { error: dbError } = await supabase.from("User").upsert([{
            id: authData.user.id,
            profileName: form.profileName,
            username: form.username.trim().toLowerCase(),
            age: form.age ? parseInt(form.age) : null,
            gender: form.gender,
            country: form.country,
            image: null
          }]);

          if (dbError) throw dbError;

          alert("تم إنشاء الحساب! جاري تسجيل الدخول...");
          // 3. تسجيل الدخول فوراً بعد التسجيل
          await supabase.auth.signInWithPassword({ 
            email: internalEmail, 
            password: form.password 
          });
          router.push("/");
        }
      } else {
        // تسجيل الدخول العادي
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: form.password,
        });

        if (loginError) throw loginError;
        router.push("/");
      }
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-white">
        <h1 className="text-4xl font-black text-emerald-600 mb-8 italic tracking-tighter text-center">REDA CHAT</h1>
        
        {/* أزرار التبديل */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button 
            type="button"
            onClick={() => setMode("login")} 
            className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "login" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}
          >
            دخول
          </button>
          <button 
            type="button"
            onClick={() => setMode("register")} 
            className={`w-1/2 py-3 rounded-xl font-bold transition-all ${mode === "register" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}
          >
            جديد
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {mode === "register" && (
            <>
              <input 
                placeholder="الاسم الكامل (مثال: رضا محمد)" 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300 transition-all" 
                onChange={e => setForm({...form, profileName: e.target.value})} 
                required 
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="العمر" 
                  className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" 
                  onChange={e => setForm({...form, age: e.target.value})} 
                />
                <select 
                  className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300 text-slate-500"
                  onChange={e => setForm({...form, gender: e.target.value})}
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
              <input 
                placeholder="البلد" 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-emerald-300" 
                onChange={e => setForm({...form, country: e.target.value})} 
              />
            </>
          )}
          
          <input 
            type="text" 
            placeholder="اسم المستخدم (بالإنجليزي)" 
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
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg mt-4 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري المعالجة...</span>
              </>
            ) : (
              mode === "register" ? "إنشاء حساب مجاني" : "دخول للتطبيق"
            )}
          </button>
        </form>
        
        <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed">
          بإنشائك للحساب أنت توافق على شروط استخدام REDA CHAT وسياسة الخصوصية.
        </p>
      </div>
    </div>
  );
}