"use client";

import { useRef, useState } from "react";

type CreatePostProps = {
  supabase: any;
  user: { id: string };
  onPostCreated: () => Promise<void> | void;
};

export default function CreatePost({
  supabase,
  user,
  onPostCreated,
}: CreatePostProps) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async (file?: File) => {
    if (!content.trim() && !file) {
      return;
    }

    setUploading(true);
    let image: string | null = null;

    try {
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from("posts").getPublicUrl(fileName);
        image = data.publicUrl;
      }

      const { error: insertError } = await supabase.from("Post").insert([
        {
          content: content.trim(),
          authorId: user.id,
          image,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setContent("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await onPostCreated();
    } catch (error: any) {
      console.error("Post Error:", error);
      alert(`Publishing failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share an update with your friends"
        className="min-h-28 w-full resize-none rounded-[24px] bg-slate-50 p-4 text-sm outline-none ring-0 transition focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            type="button"
          >
            Add image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePost(e.target.files[0])}
          />
        </div>

        <button
          onClick={() => handlePost()}
          disabled={uploading}
          type="button"
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </section>
  );
}
