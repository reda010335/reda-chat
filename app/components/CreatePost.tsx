"use client";
import { useState, useRef } from "react";

export default function CreatePost({ supabase, user, onPostCreated }: any) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async (file?: File) => {
    // منع النشر لو مفيش محتوى ولا صورة
    if (!content.trim() && !file) return;
    
    setUploading(true);
    let mediaUrl = null;

    try {
      // 1. معالجة رفع الملفات (صور أو فيديو)
      if (file) {
        const fileExt = file.name.split('.').pop();
        // تنظيم الملفات في فولدرات باسم المستخدم
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: upErr } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      // 2. إرسال البيانات لقاعدة البيانات
      const { error: insErr } = await supabase.from("Post").insert([{
        // الحل السحري لمشكلة الـ id: توليد UUID محلياً
        id: crypto.randomUUID(), 
        content: content,
        authorId: user.id,
        mediaUrl: mediaUrl,
        mediaType: file?.type.startsWith('video') ? 'video' : (mediaUrl ? 'image' : 'text'),
        createdAt: new Date().toISOString()
      }]);

      if (insErr) throw insErr;
      
      // 3. نجاح العملية وتنظيف الواجهة
      alert("تم النشر بنجاح! 🚀");
      setContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onPostCreated(); 

    } catch (err: any) {
      console.error("Post Error:", err);
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
        {/* زر اختيار الميديا */}
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="text-2xl hover:scale-110 transition-transform p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
          title="صور أو فيديو"
        >
          🖼️
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*,video/*" 
          onChange={(e) => e.target.files?.[0] && handlePost(e.target.files[0])} 
        />

        {/* زر النشر */}
        <button 
          onClick={() => handlePost()} 
          disabled={uploading} 
          className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-black text-sm shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              جاري...
            </span>
          ) : "نشر"}
        </button>
      </div>
    </div>
  );
}