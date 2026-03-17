"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

// --- إضافة استيراد مكتبة ستريم ---
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";

type User = {
  id: string;
  profileName: string;
  username: string;
  image?: string;
};

export default function ChatListPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // --- جلب بياناتي وكل المستخدمين ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");

      // تصحيح جلب البيانات من جدول User
      const { data: profile } = await supabase.from("User").select("*").eq("id", user.id).maybeSingle();
      
      if (profile) {
        setMe(profile);
      }

      const { data: users } = await supabase
        .from("User")
        .select("*")
        .not("id", "eq", user.id)
        .order("profileName", { ascending: true });

      setAllUsers(users || []);
    };
    fetchData();
  }, []);

  // --- 1. إضافة نظام استقبال المكالمات (Realtime) ---
  useEffect(() => {
    if (!me) return;

    const channel = supabase
      .channel(`global_calls_${me.id}`)
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "Message" }, 
        (payload) => {
          const msg = payload.new;
          // لو حد بعت رسالة نوعها call وموجهة ليا
          if (msg.type === "call" && msg.receiver_id === me.id) {
            if (confirm(`مكالمة فيديو واردة من صديق.. هل تود الرد؟`)) {
              router.push(`/call/${msg.call_id}`);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me]);

  // --- 2. دالة بدء المكالمة السريعة ---
  const startQuickCall = async (receiverId: string) => {
    if (!me) return;
    const callId = [me.id, receiverId].sort().join("_");
    
    // إرسال إشارة المكالمة في الداتابيز
    await supabase.from("Message").insert([{
      content: "📞 بدء مكالمة فيديو...",
      sender_id: me.id,
      receiver_id: receiverId,
      type: "call",
      call_id: callId
    }]);

    router.push(`/call/${callId}`);
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("User")
        .select("*")
        .ilike("username", `%${searchTerm}%`)
        .not("id", "eq", me?.id || "")
        .limit(10);
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-32" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">المحادثات والأصدقاء</h1>
        {me?.image && <img src={me.image} className="w-10 h-10 rounded-full border-2 border-emerald-500" />}
      </div>

      {/* بحث */}
      <div className="flex gap-2 mb-6">
        <input
          placeholder="ابحث عن مستخدم..."
          className="flex-1 p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 ring-emerald-500 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => setSearchActive(true)}
          onKeyDown={e => e.key === "Enter" && searchUsers()}
        />
        <button
          onClick={searchUsers}
          className="bg-emerald-600 text-white px-6 rounded-2xl font-bold"
          disabled={loading || !searchActive}
        >
          {loading ? "جار البحث..." : "بحث"}
        </button>
      </div>

      {/* قائمة المستخدمين مع أزرار المكالمات */}
      <div className="mb-6">
        <h2 className="font-bold mb-2 text-slate-700">المستخدمين</h2>
        {allUsers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">لا يوجد مستخدمين آخرين</p>
        ) : (
          <div className="space-y-3">
            {allUsers.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/chat/${u.id}`)}>
                  <img src={u.image || "/user.png"} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{u.profileName}</span>
                    <span className="text-[10px] text-slate-400">@{u.username}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* زرار اتصال فيديو سريع */}
                  <button
                    onClick={() => startQuickCall(u.id)}
                    className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    📹
                  </button>
                  <button
                    onClick={() => router.push(`/chat/${u.id}`)}
                    className="bg-slate-100 text-slate-600 px-4 py-1 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    دردشة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}