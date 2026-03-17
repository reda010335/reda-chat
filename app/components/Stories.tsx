"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  profileName: string;
};

type Story = {
  id: string;
  imageUrl: string;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    profileName: string;
    image?: string | null;
  };
};

type StoriesProps = {
  supabase: any;
  user: User | null;
};

export default function Stories({ supabase, user }: StoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const storiesSince = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("Story")
        .select(`
          id,
          imageUrl,
          createdAt,
          authorId,
          author:User!Story_authorId_fkey(
            id,
            profileName,
            image
          )
        `)
        .gte("createdAt", storiesSince)
        .order("createdAt", { ascending: false });

      if (error) throw error;

      setStories((data as Story[]) || []);
    } catch (err: any) {
      console.error("Fetch stories error:", err.message);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `stories/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("posts").getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const { error: insertError } = await supabase.from("Story").insert([
        {
          imageUrl,
          authorId: user.id,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      await fetchStories();
    } catch (err: any) {
      console.error("Story upload error:", err.message);
      alert(`فشل رفع الاستوري: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!user) return;

    const confirmed = window.confirm("هل تريد حذف الاستوري؟");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("Story")
        .delete()
        .eq("id", storyId)
        .eq("authorId", user.id);

      if (error) throw error;

      setStories((prev) => prev.filter((story) => story.id !== storyId));
      setActiveStory(null);
    } catch (err: any) {
      console.error("Delete story error:", err.message);
      alert(`فشل حذف الاستوري: ${err.message}`);
    }
  };

  return (
    <>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-500 bg-white font-bold text-emerald-500 dark:bg-slate-900">
            {uploading ? <span className="animate-spin text-xs">...</span> : "+"}
          </div>
          <span className="text-[10px] font-bold dark:text-white">قصتك</span>
          <input type="file" hidden accept="image/*" onChange={handleUpload} />
        </label>

        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex shrink-0 flex-col items-center gap-1"
            type="button"
          >
            <div className="h-16 w-16 rounded-full border-2 border-emerald-500 p-0.5">
              <img
                src={story.imageUrl}
                alt={story.author.profileName}
                className="h-full w-full rounded-full border-2 border-white object-cover dark:border-slate-900"
              />
            </div>
            <span className="w-16 truncate text-center text-[10px] dark:text-white">
              {story.author.profileName.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white dark:bg-slate-950">
            <img
              src={activeStory.imageUrl}
              alt={activeStory.author.profileName}
              className="max-h-[80vh] w-full object-cover"
            />

            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {activeStory.author.profileName}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(activeStory.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>

              <div className="flex gap-2">
                {user?.id === activeStory.authorId && (
                  <button
                    onClick={() => handleDeleteStory(activeStory.id)}
                    className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-600"
                    type="button"
                  >
                    حذف
                  </button>
                )}

                <button
                  onClick={() => setActiveStory(null)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-white"
                  type="button"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
