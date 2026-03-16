"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  profileName: string;
  image?: string;
};

type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  text?: string;
  createdAt: string;
  sender?: User;
};

export default function FriendsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // جلب بيانات المستخدم الحالي
  useEffect(() => {
    const fetchMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/signup");
      setMe({
        id: user.id,
        username: (user as any).username || "",
        profileName: (user as any).profileName || "",
        image: (user as any).image || "",
      });
      fetchFriends(user.id);
      fetchFriendRequests(user.id);
    };
    fetchMe();
  }, []);

  // جلب الأصدقاء
  const fetchFriends = async (myId: string) => {
    const { data: requests } = await supabase
      .from("Friend Request")
      .select("*, sender:User!FriendRequest_senderId_fkey(*), receiver:User!FriendRequest_receiverId_fkey(*)")
      .or(`and(senderId.eq.${myId},status.eq.accepted),and(receiverId.eq.${myId},status.eq.accepted)`);

    if (!requests) return;
    const friendsList: User[] = requests.map((r: any) => {
      const userObj = r.senderId === myId ? r.receiver : r.sender;
      return {
        id: userObj.id,
        profileName: userObj.profileName,
        username: userObj.username,
        image: userObj.image,
      };
    });
    setFriends(friendsList);
  };

  // جلب طلبات الصداقة المرسلة إليك
  const fetchFriendRequests = async (myId: string) => {
    const { data } = await supabase
      .from("Friend Request")
      .select("*, sender:User!FriendRequest_senderId_fkey(*)")
      .eq("receiverId", myId)
      .eq("status", "pending");
    setFriendRequests(data || []);
  };

  // إرسال طلب صداقة
  const sendFriendRequest = async (targetId: string) => {
    if (!me) return;
    setLoading(true);
    try {
      await supabase.from("Friend Request").insert([
        { senderId: me.id, receiverId: targetId, status: "pending", text: "طلب صداقة" }
      ]);
      alert("تم إرسال طلب الصداقة!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // قبول أو رفض طلب صداقة
  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    setLoading(true);
    try {
      await supabase
        .from("Friend Request")
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", requestId);
      if (me) {
        fetchFriends(me.id);
        fetchFriendRequests(me.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // البحث عن مستخدمين
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
    <div className="min-h-screen bg-slate-50 p-4 pb-24" dir="rtl">
      <h1 className="text-2xl font-black mb-4">الأصدقاء وطلبات الصداقة</h1>

      {/* البحث */}
      <div className="flex gap-2 mb-6">
        <input
          placeholder="ابحث عن مستخدم..."
          className="flex-1 p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 ring-emerald-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
        />
        <button
          onClick={searchUsers}
          className="bg-emerald-600 text-white px-6 rounded-2xl font-bold"
          disabled={loading}
        >
          {loading ? "جار البحث..." : "بحث"}
        </button>
      </div>

      {/* نتائج البحث */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-slate-700">نتائج البحث</h2>
          <div className="space-y-3">
            {searchResults.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <span>{u.profileName} (@{u.username})</span>
                <button
                  onClick={() => sendFriendRequest(u.id)}
                  className="bg-emerald-600 text-white px-4 py-1 rounded-xl font-bold text-xs"
                >
                  إرسال طلب صداقة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* طلبات الصداقة */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-slate-700">طلبات الصداقة الواردة</h2>
          <div className="space-y-3">
            {friendRequests.map(req => (
              <div key={req.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <span>{req.sender?.profileName} (@{req.sender?.username})</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFriendRequest(req.id, true)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded-xl font-bold text-xs"
                  >
                    قبول
                  </button>
                  <button
                    onClick={() => handleFriendRequest(req.id, false)}
                    className="bg-red-100 text-red-500 px-3 py-1 rounded-xl font-bold text-xs"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* قائمة الأصدقاء */}
      <div>
        <h2 className="font-bold mb-2 text-slate-700">الأصدقاء</h2>
        {friends.length === 0 ? (
          <p className="text-slate-400 text-sm">لا يوجد أصدقاء بعد</p>
        ) : (
          <div className="space-y-3">
            {friends.map(f => (
              <div key={f.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <span>{f.profileName} (@{f.username})</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/chat/${f.id}`)}
                    className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-bold text-xs"
                  >
                    دردشة
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${f.id}`)}
                    className="bg-slate-50 text-slate-800 px-3 py-1 rounded-xl font-bold text-xs"
                  >
                    بروفايل
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