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
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setContent("");
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) {
      return;
    }

    setUploading(true);
    let image: string | null = null;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `posts/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, selectedFile);

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
          createdAt: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      resetForm();
      await onPostCreated();
    } catch (error: any) {
      console.error("Post Error:", error);
      alert(`فشل نشر البوست: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = (file?: File) => {
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/90">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="بم تفكر الآن؟"
        className="min-h-28 w-full resize-none rounded-[24px] bg-slate-50 p-4 text-sm outline-none ring-0 transition focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
      />

      {preview && (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-700">
          <img
            src={preview}
            alt="preview"
            className="max-h-[24rem] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            type="button"
          >
            إضافة صورة
          </button>

          {selectedFile && (
            <button
              onClick={resetForm}
              className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200"
              type="button"
            >
              إزالة
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handlePickFile(e.target.files?.[0])}
          />
        </div>

        <button
          onClick={handlePost}
          disabled={uploading}
          type="button"
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "جارٍ النشر..." : "نشر"}
        </button>
      </div>
    </section>
  );
}
