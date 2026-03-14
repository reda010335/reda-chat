"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");

      // جلب الإشعارات مع بيانات الشخص اللي بعت الإشعار
      const { data } = await supabase
        .from("Notification")
        .select(`*, sender:User!Notification_senderId_fkey(profileName, image, username)`)
        .eq("receiverId", user.id)
        .order("created_at", { ascending: false });

      if (data) setNotifications(data);
      
      // بمجرد فتح الصفحة، بنخلي كل الإشعارات "مقروءة"
      await supabase.from("Notification").update({ isRead: true }).eq("receiverId", user.id);
      
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-5 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-xl">➡️</button>
        <h1 className="text-xl font-black dark:text-white">الإشعارات</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-slate-400">لا توجد إشعارات حتى الآن</div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${notif.isRead ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 shadow-sm'}`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border-2 border-white dark:border-slate-700">
                {notif.sender?.image ? <img src={notif.sender.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-emerald-600">{notif.sender?.profileName[0]}</div>}
              </div>
              
              <div className="flex-1">
                <p className="text-sm dark:text-white leading-tight">
                  <span className="font-black">{notif.sender?.profileName}</span> 
                  {notif.type === 'like' ? ' أعجب بمنشورك ❤️' : 
                   notif.type === 'follow' ? ' بدأ في متابعتك ✅' : 
                   ' تفاعل معك'}
                </p>
                <span className="text-[10px] text-slate-400">
                   {new Date(notif.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {notif.type === 'follow' && (
                <button className="bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">رد المتابعة</button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}