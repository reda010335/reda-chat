"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";

type User = {
  id: string;
  username: string;
  profileName: string;
  image?: string;
  coverImage?: string;
  bio?: string;
};

type Post = {
  id: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  author: User;
};

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const { id } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [myUser, setMyUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // جلب بيانات البروفايل والمستخدم الحالي
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");
      setMyUser({ id: user.id, profileName: (user as any).profileName, username: (user as any).username, image: (user as any).image });

      const { data: profile } = await supabase.from("User").select("*").eq("id", id).maybeSingle();
      setUser(profile);

      // تحقق إذا أنا متابع الشخص
      const { data: followData } = await supabase.from("Follow").select("*").eq("follower_id", user.id).eq("following_id", id).maybeSingle();
      setIsFollowing(!!followData);
    };

    fetchProfile();
    fetchPosts();
  }, [id]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("Post")
      .select(`*, author:User(*)`)
      .eq("author_id", id)
      .order("createdAt", { ascending: false });
    setPosts(data || []);
  };

  const handleFollow = async () => {
    if (!myUser) return;
    if (isFollowing) {
      await supabase.from("Follow").delete().eq("follower_id", myUser.id).eq("following_id", id);
      setIsFollowing(false);
    } else {
      await supabase.from("Follow").insert([{ follower_id: myUser.id, following_id: id }]);
      setIsFollowing(true);
    }
  };

  if (!user) return <div className="h-screen flex items-center justify-center text-xl font-bold">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32" dir="rtl">
      {/* Cover Image */}
      <div className="relative w-full h-60 bg-gray-300 dark:bg-slate-800">
        {user.coverImage && <img src={user.coverImage} className="w-full h-full object-cover" />}
        <div className="absolute bottom-0 left-4">
          {/* Profile Image */}
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-950 overflow-hidden -mb-14">
            {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center w-full h-full bg-emerald-500 text-white font-bold text-3xl">{user.profileName[0]}</span>}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-16 px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">{user.profileName}</h1>
          <p className="text-slate-500">@{user.username}</p>
          {user.bio && <p className="text-slate-700 mt-2">{user.bio}</p>}
        </div>
        <div className="flex gap-2">
          {myUser?.id === user.id ? (
            <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">تعديل البروفايل</button>
          ) : (
            <>
              <button onClick={handleFollow} className={`px-4 py-2 rounded-xl font-bold ${isFollowing ? "bg-gray-200 dark:bg-slate-800 text-slate-800 dark:text-white" : "bg-emerald-600 text-white"}`}>
                {isFollowing ? "متابع" : "متابعة"}
              </button>
              <button onClick={() => router.push(`/chat/${user.id}`)} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">رسالة</button>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-6 px-4 space-y-5">
        {posts.length === 0 && <p className="text-slate-400">لا يوجد منشورات بعد</p>}
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <img src={post.author.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-sm">{post.author.profileName}</h4>
                <p className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleString("ar-EG")}</p>
              </div>
            </div>
            <p className="text-sm dark:text-slate-300">{post.content}</p>
            {post.mediaUrl && <img src={post.mediaUrl} className="w-full mt-2 rounded-xl object-cover max-h-96" />}
          </div>
        ))}
      </div>
    </div>
  );
}