"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePost from "@/app/components/CreatePost";
import Stories from "@/app/components/Stories";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type UserProfile = {
  id: string;
  profileName: string;
  username: string;
  image?: string | null;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author?: UserProfile | null;
};

type RawPost = {
  id: string;
  content: string;
  createdAt: string;
  image?: string | null;
  authorId: string;
};

type Post = RawPost & {
  author?: UserProfile | null;
  likes?: { id: string; userId: string }[];
  comments?: CommentItem[];
};

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const fetchPosts = useCallback(async () => {
    const { data: postsData, error: postsError } = await supabase
      .from("Post")
      .select("id, content, createdAt, image, authorId")
      .order("createdAt", { ascending: false });

    if (postsError) {
      console.error("Fetch posts error:", postsError.message);
      return;
    }

    const postRows = (postsData as RawPost[]) || [];

    const authorIds = [...new Set(postRows.map((post) => post.authorId))];

    const { data: usersData } = await supabase
      .from("User")
      .select("id, profileName, username, image")
      .in("id", authorIds);

    const usersMap = new Map(
      ((usersData as UserProfile[]) || []).map((item) => [item.id, item])
    );

    const { data: likesData } = await supabase
      .from("Like")
      .select("id, postId, userId");

    const { data: commentsData } = await supabase
      .from("Comment")
      .select("id, content, createdAt, postId, authorId");

    const commentsAuthorIds = [
      ...new Set(((commentsData as any[]) || []).map((comment) => comment.authorId)),
    ];

    const { data: commentUsersData } = await supabase
      .from("User")
      .select("id, profileName, username, image")
      .in("id", commentsAuthorIds.length ? commentsAuthorIds : [""]);

    const commentUsersMap = new Map(
      ((commentUsersData as UserProfile[]) || []).map((item) => [item.id, item])
    );

    const likesByPost = new Map<string, { id: string; userId: string }[]>();
    ((likesData as any[]) || []).forEach((like) => {
      const current = likesByPost.get(like.postId) || [];
      current.push({ id: like.id, userId: like.userId });
      likesByPost.set(like.postId, current);
    });

    const commentsByPost = new Map<string, CommentItem[]>();
    ((commentsData as any[]) || []).forEach((comment) => {
      const current = commentsByPost.get(comment.postId) || [];
      current.push({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        author: commentUsersMap.get(comment.authorId) || null,
      });
      commentsByPost.set(comment.postId, current);
    });

    const finalPosts: Post[] = postRows.map((post) => ({
      ...post,
      author: usersMap.get(post.authorId) || null,
      likes: likesByPost.get(post.id) || [],
      comments: commentsByPost.get(post.id) || [],
    }));

    setPosts(finalPosts);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signup");
        return;
      }

      const { data: profile } = await supabase
        .from("User")
        .select("id, profileName, username, image")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/signup");
        return;
      }

      if (isMounted) {
        setUser(profile as UserProfile);
      }

      await fetchPosts();

      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, router, supabase]);

  const handleLike = async (post: Post) => {
    if (!user) return;

    const liked = post.likes?.some((like) => like.userId === user.id);

    try {
      if (liked) {
        const { error } = await supabase
          .from("Like")
          .delete()
          .eq("postId", post.id)
          .eq("userId", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("Like").insert([
          {
            postId: post.id,
            userId: user.id,
          },
        ]);

        if (error) throw error;
      }

      await fetchPosts();
    } catch (err: any) {
      console.error("Like error:", err.message);
      alert(`فشل تحديث اللايك: ${err.message}`);
    }
  };

  const handleComment = async () => {
    if (!user || !activePost || !commentText.trim()) return;

    try {
      const { error } = await supabase.from("Comment").insert([
        {
          content: commentText.trim(),
          postId: activePost.id,
          authorId: user.id,
        },
      ]);

      if (error) throw error;

      setCommentText("");
      await fetchPosts();
    } catch (err: any) {
      console.error("Comment error:", err.message);
      alert(`فشل إضافة التعليق: ${err.message}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    const confirmed = window.confirm("هل تريد حذف المنشور؟");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("Post")
        .delete()
        .eq("id", postId)
        .eq("authorId", user.id);

      if (error) throw error;

      setMenuPostId(null);
      setActivePost(null);
      await fetchPosts();
    } catch (err: any) {
      console.error("Delete post error:", err.message);
      alert(`فشل حذف المنشور: ${err.message}`);
    }
  };

  const handleShare = async (post: Post) => {
    const text = `${post.content || ""} ${post.image || ""}`.trim();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "REDA CHAT",
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(text || window.location.href);
        alert("تم نسخ محتوى المنشور.");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl font-black italic text-emerald-600">
        REDA CHAT
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-32" dir="rtl">
        <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                Social Feed
              </p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                REDA CHAT
              </h1>
            </div>

            <button
              onClick={() => router.push("/notifications")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-slate-800"
            >
              Notifications
            </button>
          </div>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
            <Stories supabase={supabase} user={user} />
          </section>

          {user && (
            <CreatePost
              supabase={supabase}
              user={user}
              onPostCreated={fetchPosts}
            />
          )}

          <section className="space-y-5">
            {posts.map((post) => {
              const likesCount = post.likes?.length || 0;
              const commentsCount = post.comments?.length || 0;
              const likedByMe = !!post.likes?.some(
                (like) => like.userId === user?.id
              );

              return (
                <article
                  key={post.id}
                  className="relative rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author?.image || "/user.png"}
                        alt={post.author?.profileName || "User"}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">
                          {post.author?.profileName || "Unknown user"}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {new Date(post.createdAt).toLocaleString("ar-EG")}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuPostId((prev) => (prev === post.id ? null : post.id))
                        }
                        className="rounded-full px-3 py-2 text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        type="button"
                      >
                        ...
                      </button>

                      {menuPostId === post.id && (
                        <div className="absolute left-0 top-12 z-20 min-w-40 rounded-2xl border bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                          <button
                            onClick={() => {
                              setActivePost(post);
                              setMenuPostId(null);
                            }}
                            className="block w-full rounded-xl px-3 py-2 text-right text-sm hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                            type="button"
                          >
                            فتح المنشور
                          </button>

                          {user?.id === post.authorId && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="block w-full rounded-xl px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50"
                              type="button"
                            >
                              حذف المنشور
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePost(post)}
                    className="block w-full text-right"
                    type="button"
                  >
                    {post.content ? (
                      <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                        {post.content}
                      </p>
                    ) : null}

                    {post.image ? (
                      <img
                        src={post.image}
                        alt="Post media"
                        className="max-h-[28rem] w-full rounded-[24px] object-cover"
                      />
                    ) : null}
                  </button>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      onClick={() => handleLike(post)}
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        likedByMe
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white"
                      }`}
                      type="button"
                    >
                      Like ({likesCount})
                    </button>

                    <button
                      onClick={() => setActivePost(post)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-white"
                      type="button"
                    >
                      Comment ({commentsCount})
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-white"
                      type="button"
                    >
                      Share
                    </button>
                  </div>
                </article>
              );
            })}

            {posts.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                No posts yet. Create the first one.
              </div>
            ) : null}
          </section>
        </main>
      </div>

      {activePost && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/70 p-4">
          <div className="mx-auto mt-10 max-w-2xl rounded-[30px] bg-white p-5 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900 dark:text-white">
                  {activePost.author?.profileName}
                </h2>
                <p className="text-xs text-slate-500">
                  {new Date(activePost.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>

              <button
                onClick={() => setActivePost(null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-white"
                type="button"
              >
                إغلاق
              </button>
            </div>

            {activePost.content ? (
              <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {activePost.content}
              </p>
            ) : null}

            {activePost.image ? (
              <img
                src={activePost.image}
                alt="Post media"
                className="mb-4 max-h-[30rem] w-full rounded-[24px] object-cover"
              />
            ) : null}

            <div className="mb-4 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليق..."
                className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleComment}
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
                type="button"
              >
                إرسال
              </button>
            </div>

            <div className="space-y-3">
              {(activePost.comments || []).map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {comment.author?.profileName || "User"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {comment.content}
                  </p>
                </div>
              ))}

              {(activePost.comments || []).length === 0 ? (
                <div className="text-center text-sm text-slate-400">
                  لا توجد تعليقات بعد
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
