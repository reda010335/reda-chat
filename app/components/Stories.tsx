"use client";
import { useState, useEffect } from "react";

type User = { id: string; profileName: string };
type Story = { id: string; imageUrl: string; author: { profileName: string } };

type StoriesProps = {
  supabase: any;
  user: User | null;
};

export default function Stories({ supabase, user }: StoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("Story")
        .select(`id, imageUrl, author:User(profileName)`)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      if (data) setStories(data);
    } catch (err: any) {
      console.error("Fetch stories error:", err.message);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: upErr } = await supabase.storage.from("stories").upload(fileName, file);
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("stories").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { error: insErr } = await supabase.from("Story").insert([
        { imageUrl: publicUrl, authorId: user.id }
      ]);
      if (insErr) throw insErr;

      await fetchStories();
      alert("تم رفع الاستوري بنجاح! ✨");
    } catch (err: any) {
      console.error("Story upload error:", err.message);
      alert(`خطأ في الاستوري: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
      {/* زر رفع الاستوري */}
      <label className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center text-emerald-500 bg-white dark:bg-slate-900 font-bold">
          {uploading ? <span className="animate-spin text-xs">⌛</span> : "+"}
        </div>
        <span className="text-[10px] dark:text-white font-bold">قصتك</span>
        <input type="file" hidden accept="image/*" onChange={handleUpload} />
      </label>

      {/* عرض الاستوريز */}
      {stories.map((s) => (
        <div key={s.id} className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5">
            <img
              src={s.imageUrl}
              className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
            />
          </div>
          <span className="text-[10px] dark:text-white truncate w-16 text-center">
            {s.author.profileName.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  );
}