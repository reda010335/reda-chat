"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type UserProfile = {
  id: string;
  profileName: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  country?: string | null;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
  image?: string | null;
};

export default function ProfilePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authUserId, setAuthUserId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const [{ data: user }, { data: userPosts }, { data: myFollow }, { data: reverseFollow }] = await Promise.all([
        supabase
          .from("User")
          .select("id, profileName, username, image, bio, country")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("Post")
          .select("id, content, createdAt, image")
          .eq("authorId", userId)
          .order("createdAt", { ascending: false }),
        authUser
          ? supabase
              .from("Follow")
              .select("id")
              .eq("followerId", authUser.id)
              .eq("followingId", userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        authUser
          ? supabase
              .from("Follow")
              .select("id")
              .eq("followerId", userId)
              .eq("followingId", authUser.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (isMounted) {
        setAuthUserId(authUser?.id || "");
        setProfile((user as UserProfile) || null);
        setPosts((userPosts as Post[]) || []);
        setIsFollowing(Boolean(myFollow));
        setFollowsMe(Boolean(reverseFollow));
        setLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  if (loading) {
    return <div className="p-10 text-center dark:text-white">Loading profile...</div>;
  }

  const isMyProfile = authUserId === userId;

  const handleFollowToggle = async () => {
    if (!authUserId || isMyProfile || followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("Follow")
          .delete()
          .eq("followerId", authUserId)
          .eq("followingId", userId);

        await supabase
          .from("Friendship")
          .delete()
          .or(
            `and(userId.eq.${authUserId},friendId.eq.${userId}),and(userId.eq.${userId},friendId.eq.${authUserId})`
          );

        setIsFollowing(false);
      } else {
        await supabase.from("Follow").insert({
          followerId: authUserId,
          followingId: userId,
          createdAt: new Date().toISOString(),
        });

        if (followsMe) {
          await supabase.from("Friendship").upsert(
            [
              { userId: authUserId, friendId: userId },
              { userId, friendId: authUserId },
            ],
            { onConflict: "userId,friendId" }
          );
        }

        await supabase.from("Notification").insert({
          receiverId: userId,
          senderId: authUserId,
          type: "follow",
          isRead: false,
          created_at: new Date().toISOString(),
        });

        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
      alert("تعذر تنفيذ العملية الآن");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6" dir="rtl">
      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
        <div className="h-44 bg-[linear-gradient(135deg,_#059669,_#0f766e,_#1d4ed8)] md:h-60" />

        <div className="px-6 pb-6">
          <div className="-mt-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <img
                src={profile?.image || "/user.png"}
                alt={profile?.profileName || "Profile"}
                className="h-32 w-32 rounded-full border-4 border-white object-cover dark:border-slate-900"
              />
              <div className="text-center md:text-right">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  {profile?.profileName || "Unknown user"}
                </h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  @{profile?.username || "user"}
                </p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {profile?.bio || "No bio added yet."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isMyProfile ? (
                <>
                  <button
                    onClick={() => router.push(`/chat/${userId}`)}
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                    type="button"
                  >
                    مراسلة
                  </button>
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                      isFollowing
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    type="button"
                  >
                    {followLoading
                      ? "..."
                      : isFollowing && followsMe
                      ? "أصدقاء"
                      : isFollowing
                      ? "إلغاء المتابعة"
                      : followsMe
                      ? "رد متابعة"
                      : "متابعة"}
                  </button>
                  {isFollowing && followsMe ? (
                    <span className="self-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      أنتم أصدقاء ✅
                    </span>
                  ) : null}
                </>
              ) : null}

              <button
                onClick={() => router.back()}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                type="button"
              >
                رجوع
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
            <aside className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Details</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Country: {profile?.country || "Not specified"}</p>
                <p>Posts: {posts.length}</p>
              </div>
            </aside>

            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <p className="text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {post.content}
                  </p>
                  {post.image ? (
                    <img
                      src={post.image}
                      alt="Post media"
                      className="mt-4 max-h-[28rem] w-full rounded-[18px] object-cover"
                    />
                  ) : null}
                </article>
              ))}

              {posts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                  This user has not posted anything yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}