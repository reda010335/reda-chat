"use client";
import { useState, useRef } from "react";

// تأكد أنك بتستلم supabase و user كـ Props
export default function CreatePost({ supabase, user, onPostCreated }: any) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async (file?: File) => {
    if (!content.trim() && !file) return;
    setUploading(true);
    let mediaUrl = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        
        // الرفع لـ bucket اسمه posts (تأكد أنه حروف صغيرة في سوبابيز)
        const { error: upErr } = await supabase.storage
          .from('posts') 
          .upload(fileName, file);

        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      const { error: insErr } = await supabase.from("Post").insert([{
        content: content,
        authorId: user.id,
        mediaUrl: mediaUrl,
        mediaType: file?.type.startsWith('video') ? 'video' : (mediaUrl ? 'image' : 'text')
      }]);

      if (insErr) throw insErr;
      
      alert("تم النشر بنجاح! 🚀");
      setContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onPostCreated(); 
    } catch (err: any) {
      alert(`فشل النشر: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[30px] p-5 shadow-sm border dark:border-slate-800">
      <textarea 
        value={content} 
        onChange={e => setContent(e.target.value)} 
        placeholder="إيه الجديد يا بطل؟" 
        className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none resize-none dark:text-white" 
        rows={2} 
      />
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => fileInputRef.current?.click()} className="text-2xl">🖼️🎥</button>
        <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handlePost(e.target.files[0])} />
        <button 
          onClick={() => handlePost()} 
          disabled={uploading} 
          className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-black text-sm disabled:opacity-50"
        >
          {uploading ? "جاري..." : "نشر"}
        </button>
      </div>
    </div>
  );
}