"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();

  // حالات البيانات
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    profileName: "",
    username: "",
    age: "",
    gender: "ذكر",
    country: "",
    image: "" // رابط الصورة (اختياري)
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. إنشاء الحساب في Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) return alert("خطأ في التسجيل: " + authError.message);

    if (authData.user) {
      // 2. حفظ البيانات الإضافية في جدول User
      const { error: dbError } = await supabase.from("User").insert([
        {
          id: authData.user.id,
          profileName: formData.profileName,
          username: formData.username,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender,
          country: formData.country,
          image: formData.image || null // لو مفيش صورة هتنزل null
        }
      ]);

      if (dbError) {
        alert("حدث خطأ أثناء حفظ البيانات الشخصية");
      } else {
        router.push("/chat"); // التوجه للدردشة فوراً
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[35px] shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-emerald-600">انضم إلينا</h1>
          <p className="text-slate-400 text-sm mt-2">أنشئ حسابك وابدأ الدردشة الآن</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input 
            type="text" 
            placeholder="الاسم اللي هيظهر للناس" 
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
            onChange={(e) => setFormData({...formData, profileName: e.target.value})}
            required 
          />
          
          <input 
            type="text" 
            placeholder="اسم المستخدم (username@)" 
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required 
          />

          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />

          <input 
            type="password" 
            placeholder="كلمة المرور" 
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />

          <div className="flex gap-3">
            <input 
              type="number" 
              placeholder="العمر" 
              className="w-1/2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
            <select 
              className="w-1/2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>

          <input 
            type="text" 
            placeholder="رابط الصورة الشخصية (اختياري)" 
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-emerald-500 dark:text-white"
            onChange={(e) => setFormData({...formData, image: e.target.value})}
          />

          <button 
            type="submit" 
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95 mt-4"
          >
            إنشاء الحساب
          </button>
        </form>
      </div>
    </div>
  );
}