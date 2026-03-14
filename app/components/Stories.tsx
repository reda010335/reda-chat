"use client";
import { useState, useEffect } from "react";

export default function Stories({ supabase, user }: any) {
  const [stories, setStories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // دالة جلب الاستوريز
  const fetchStories = async () => {
    const { data } = await supabase
      .from("Story")
      .select(`*, author:User(profileName, image)`)
      .order("createdAt", { ascending: false });
    if (data) setStories(data);
  };

  useEffect(() => { fetchStories(); }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // تأكد أن اسم الـ Bucket هنا هو 'avatars' كما في سوبابيز
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // إضافة السجل لقاعدة البيانات
      const { error: insErr } = await supabase.from("Story").insert([
        { imageUrl: publicUrl, authorId: user.id }
      ]);
      
      if (insErr) throw insErr;

      await fetchStories(); // تحديث القائمة فوراً
      alert("تم رفع الاستوري بنجاح! ✨");
    } catch (err: any) {
      alert(`خطأ في الاستوري: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
      {/* زر الرفع */}
      <label className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center text-emerald-500 bg-white dark:bg-slate-900 font-bold">
          {uploading ? <span className="animate-spin text-xs">⌛</span> : "+"}
        </div>
        <span className="text-[10px] dark:text-white font-bold">قصتك</span>
        <input type="file" hidden accept="image/*" onChange={handleUpload} />
      </label>

      {/* عرض الاستوريز */}
      {stories.map((s, i) => (
        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5">
            <img src={s.imageUrl} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" />
          </div>
          <span className="text-[10px] dark:text-white truncate w-16 text-center">
            {s.author?.profileName?.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}