"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";

type UserProfile = { id: string; profileName: string; username: string; image?: string; bio?: string; cover_image?: string };
type Post = { id: string; content: string; createdAt: string; image_url?: string };

export default function ProfilePage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      // 1. جلب بيانات المستخدم
      const { data: user } = await supabase.from("User").select("*").eq("id", userId).maybeSingle();
      if (user) setProfile(user);

      // 2. جلب منشورات المستخدم
      const { data: userPosts } = await supabase
        .from("Post")
        .select("*")
        .eq("user_id", userId)
        .order("createdAt", { ascending: false });
      
      setPosts(userPosts || []);
      setLoading(false);
    };

    fetchProfileData();
  }, [userId, supabase]);

  if (loading) return <div className="text-center mt-20 dark:text-white">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-10" dir="rtl">
      {/* Header / Cover Section */}
      <div className="bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-4xl mx-auto relative">
          {/* Cover Photo */}
          <div className="h-48 md:h-80 bg-slate-300 dark:bg-slate-800 rounded-b-lg overflow-hidden relative">
            {profile?.cover_image ? (
              <img src={profile.cover_image} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            )}
          </div>

          {/* Profile Info Area */}
          <div className="px-4 pb-4">
            <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 gap-4">
              {/* Profile Image */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-200">
                {profile?.image ? (
                  <img src={profile.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white text-4xl font-bold">
                    {profile?.profileName?.[0]}
                  </div>
                )}
              </div>

              {/* Name & Stats */}
              <div className="flex-1 text-center md:text-right mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  {profile?.profileName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">@{profile?.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-2">
                <button onClick={() => router.push(`/chat/${userId}`)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all">
                  إرسال رسالة
                </button>
                <button className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-lg font-bold">
                  ⋮
                </button>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4 text-center md:text-right border-t dark:border-slate-800 pt-4">
              <p className="text-slate-700 dark:text-slate-300 max-w-lg">
                {profile?.bio || "لا يوجد نبذة شخصية حالياً."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section (Posts) */}
      <div className="max-w-4xl mx-auto mt-6 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: About / Photos (Sidebar) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 dark:text-white">المعلومات</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">📍 يقطن في <span className="font-bold text-slate-800 dark:text-slate-200">السويس، مصر</span></li>
              <li className="flex items-center gap-2">👨‍💻 يعمل كـ <span className="font-bold text-slate-800 dark:text-slate-200">Software Developer</span></li>
            </ul>
          </div>
        </div>

        {/* Right Side: Timeline Posts */}
        <div className="md:col-span-2 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden">
                    <img src={profile?.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm dark:text-white">{profile?.profileName}</h4>
                    <p className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
                  {post.content}
                </p>
                {post.image_url && (
                  <img src={post.image_url} className="rounded-lg w-full object-cover max-h-96" />
                )}
                <div className="border-t dark:border-slate-800 mt-4 pt-3 flex justify-around text-slate-500 font-bold text-sm">
                  <button className="hover:text-emerald-500">👍 إعجاب</button>
                  <button className="hover:text-emerald-500">💬 تعليق</button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-xl text-center text-slate-400">
              لا توجد منشورات لهذا المستخدم بعد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}