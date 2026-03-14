"use client";
import { useState, useRef } from "react";

export default function CreatePost({ supabase, user, onPostCreated }: any) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async (file?: File) => {
    if (!content.trim() && !file) return;
    setUploading(true);
    let mediaUrl = null;
    let mediaType = "text";

    try {
      if (file) {
        const fileName = `post-${user.id}-${Date.now()}`;
        await supabase.storage.from('posts').upload(fileName, file);
        mediaUrl = supabase.storage.from('posts').getPublicUrl(fileName).data.publicUrl;
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }
      await supabase.from("Post").insert([{ content, authorId: user.id, mediaUrl, mediaType }]);
      setContent("");
      onPostCreated();
    } catch (err) { alert("خطأ في النشر"); }
    finally { setUploading(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[30px] p-5 shadow-sm border dark:border-slate-800">
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="اكتب حاجة أو انشر ميديا..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none resize-none dark:text-white" rows={2} />
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => fileInputRef.current?.click()} className="text-2xl hover:scale-110 transition-transform">🖼️🎥</button>
        <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handlePost(e.target.files[0])} />
        <button onClick={() => handlePost()} disabled={uploading} className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-black text-sm disabled:opacity-50">
          {uploading ? "جاري..." : "نشر"}
        </button>
      </div>
    </div>
  );
}