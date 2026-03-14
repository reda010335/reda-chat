"use client";
import { useState, useEffect } from "react";

export default function Stories({ supabase, user }: any) {
  const [stories, setStories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    const { data } = await supabase.from("Story").select(`*, author:User(profileName, image)`).order("createdAt", { ascending: false });
    if (data) setStories(data);
  };

  useEffect(() => { fetchStories(); }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileName = `story-${user.id}-${Date.now()}`;
      // الرفع
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (upErr) throw upErr;

      // جلب الرابط
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // الإدخال في الجدول مع التأكد من إتمام العملية
      const { error: insErr } = await supabase.from("Story").insert([{ imageUrl: publicUrl, authorId: user.id }]);
      if (insErr) throw insErr;

      await fetchStories(); // تحديث فوري للقائمة
    } catch (err) { 
      console.error(err);
      alert("حدث خطأ أثناء الرفع"); 
    } finally { setUploading(false); }
  };

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
      <label className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center text-emerald-500 bg-white dark:bg-slate-900 font-bold text-xl">
          {uploading ? <span className="animate-spin text-sm">⌛</span> : "+"}
        </div>
        <span className="text-[10px] dark:text-white font-bold">قصتك</span>
        <input type="file" hidden accept="image/*" onChange={handleUpload} />
      </label>
      {stories.map((s, i) => (
        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5">
            <img src={s.imageUrl} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" />
          </div>
          <span className="text-[10px] dark:text-white">{s.author?.profileName?.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}