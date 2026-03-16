"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

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

  // جلب بياناتي وكل المستخدمين
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");

      const meUser: User = {
        id: user.id,
        username: (user as any).username || "",
        profileName: (user as any).profileName || "",
        image: (user as any).image || "",
      };
      setMe(meUser);

      const { data: users } = await supabase
        .from("User")
        .select("*")
        .not("id", "eq", meUser.id)
        .order("profileName", { ascending: true });

      setAllUsers(users || []);
    };
    fetchData();
  }, []);

  // البحث
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
      <h1 className="text-2xl font-black mb-4">المحادثات والأصدقاء</h1>

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

      {/* قائمة الأصدقاء / كل المستخدمين */}
      <div className="mb-6">
        <h2 className="font-bold mb-2 text-slate-700">المستخدمين</h2>
        {allUsers.length === 0 ? (
          <p className="text-slate-400 text-sm">لا يوجد مستخدمين آخرين</p>
        ) : (
          <div className="space-y-3">
            {allUsers.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/chat/${u.id}`)}>
                  <img src={u.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold">{u.profileName}</span>
                </div>
                <button
                  onClick={() => router.push(`/chat/${u.id}`)}
                  className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-bold text-xs"
                >
                  دردشة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نتائج البحث تظهر فوق القائمة إذا فعّل المستخدم البحث */}
      {searchActive && searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-slate-700">نتائج البحث</h2>
          <div className="space-y-3">
            {searchResults.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/chat/${u.id}`)}>
                  <img src={u.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold">{u.profileName}</span>
                </div>
                <button
                  onClick={() => router.push(`/chat/${u.id}`)}
                  className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-bold text-xs"
                >
                  دردشة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}