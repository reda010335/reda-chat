"use client";

import { useEffect, useState } from "react";

type User = { id: string; profileName: string };
type Story = { id: string; imageUrl: string; author: { profileName: string } };

type StoriesProps = {
  supabase: any;
  user: User | null;
};

export default function Stories({ supabase, user }: StoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("Story")
          .select(`id, imageUrl, author:User(profileName)`)
          .order("createdAt", { ascending: false });

        if (error) {
          throw error;
        }

        if (isMounted && data) {
          setStories(data);
        }
      } catch (err: any) {
        console.error("Fetch stories error:", err.message);
      }
    };

    fetchStories();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("stories").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { error: insertError } = await supabase.from("Story").insert([
        { imageUrl: publicUrl, authorId: user.id },
      ]);
      if (insertError) throw insertError;

      const { data: refreshedStories } = await supabase
        .from("Story")
        .select(`id, imageUrl, author:User(profileName)`)
        .order("createdAt", { ascending: false });

      setStories(refreshedStories || []);
      alert("Story uploaded successfully.");
    } catch (err: any) {
      console.error("Story upload error:", err.message);
      alert(`Story upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
      <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-500 bg-white font-bold text-emerald-500 dark:bg-slate-900">
          {uploading ? <span className="animate-spin text-xs">⌛</span> : "+"}
        </div>
        <span className="text-[10px] font-bold dark:text-white">Your story</span>
        <input type="file" hidden accept="image/*" onChange={handleUpload} />
      </label>

      {stories.map((story) => (
        <div key={story.id} className="flex shrink-0 flex-col items-center gap-1">
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
        </div>
      ))}
    </div>
  );
}
