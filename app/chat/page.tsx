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
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");

      setMe({
        id: user.id,
        profileName: (user as any).profileName || "",
        username: (user as any).username || "",
        image: (user as any).image || "",
      });

      fetchChatUsers(user.id);
    };
    init();
  }, []);

  // جلب المستخدمين اللي لهم علاقة معايا (Friend أو Follow)
  const fetchChatUsers = async (myId: string) => {
    const { data: friends } = await supabase
      .from("Friend Request")
      .select(`
        sender:User!FriendRequest_senderId_fkey(*),
        receiver:User!FriendRequest_receiverId_fkey(*),
        status
      `)
      .or(`and(senderId.eq.${myId},status.eq.accepted),and(receiverId.eq.${myId},status.eq.accepted)`);

    const { data: follows } = await supabase
      .from("Follow")
      .select("follower_id, following_id, user:following_id(*)")
      .or(`and(follower_id.eq.${myId}),and(following_id.eq.${myId})`);

    const usersSet: User[] = [];

    // أصدقاء
    if (friends) {
      friends.forEach((r: any) => {
        const u = r.sender.id === myId ? r.receiver : r.sender;
        if (!usersSet.find(user => user.id === u.id)) usersSet.push(u);
      });
    }

    // متابعين / متابعة متبادلة
    if (follows) {
      follows.forEach((f: any) => {
        const u = f.user;
        if (!usersSet.find(user => user.id === u.id) && u.id !== myId) usersSet.push(u);
      });
    }

    setChatUsers(usersSet);
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !me) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("User")
        .select("*")
        .ilike("username", `%${searchTerm}%`)
        .not("id", "eq", me.id)
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
      <h1 className="text-2xl font-black mb-4">المحادثات</h1>

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

      {/* نتائج البحث */}
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

      {/* قائمة الدردشة */}
      <div>
        <h2 className="font-bold mb-2 text-slate-700">أصدقائي والمتابعين</h2>
        {chatUsers.length === 0 ? (
          <p className="text-slate-400 text-sm">لا يوجد أشخاص متاحين للدردشة</p>
        ) : (
          <div className="space-y-3">
            {chatUsers.map(f => (
              <div key={f.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/chat/${f.id}`)}>
                  <img src={f.image || "/user.png"} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold">{f.profileName}</span>
                </div>
                <button
                  onClick={() => router.push(`/chat/${f.id}`)}
                  className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-bold text-xs"
                >
                  دردشة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}