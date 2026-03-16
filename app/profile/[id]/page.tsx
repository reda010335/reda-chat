"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const { id } = useParams();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("User")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        alert("لم يتم العثور على المستخدم");
        return router.back();
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [id, supabase, router]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse">
        جاري التحميل...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-xl">⬅️</button>
        <h1 className="text-xl font-black dark:text-white">{profile.profileName}</h1>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <img
            src={profile.image || "/user.png"}
            className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-emerald-500 object-cover"
          />
          <h2 className="text-2xl font-bold dark:text-white">{profile.profileName}</h2>
          <p className="text-emerald-600 mb-4">@{profile.username}</p>
          <p className="text-sm text-slate-400">{profile.bio || "لا يوجد سيرة ذاتية بعد"}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold"
              onClick={() => router.push(`/chat/${profile.id}`)}
            >
              مراسلة
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}