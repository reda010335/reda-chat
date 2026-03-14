"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [myFollows, setMyFollows] = useState<string[]>([]);
  const [followersOfMe, setFollowersOfMe] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false); // تبديل لعرض الأصدقاء فقط

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMe(user);
        fetchRelationships(user.id);
      }
    };
    init();
  }, []);

  const fetchRelationships = async (myId: string) => {
    const { data: following } = await supabase.from("Follow").select("followingId").eq("followerId", myId);
    const { data: followers } = await supabase.from("Follow").select("followerId").eq("followingId", myId);
    
    setMyFollows(following?.map(f => f.followingId) || []);
    setFollowersOfMe(followers?.map(f => f.followerId) || []);
  };

  const searchUsers = async () => {
    if (!searchTerm) return;
    setLoading(true);
    const { data } = await supabase.from("User").select("*").ilike("username", `%${searchTerm}%`).not("id", "eq", me?.id);
    setResults(data || []);
    setLoading(false);
  };

  const handleFollow = async (targetId: string) => {
    const isFollowing = myFollows.includes(targetId);
    if (isFollowing) {
      await supabase.from("Follow").delete().eq("followerId", me.id).eq("followingId", targetId);
    } else {
      await supabase.from("Follow").insert([{ followerId: me.id, followingId: targetId }]);
      // إرسال الإشعار
      await supabase.from("Notification").insert([{ receiverId: targetId, senderId: me.id, type: "follow" }]);
    }
    fetchRelationships(me.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24" dir="rtl">
      {/* الهيدر مع أيقونة الأصدقاء */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">اكتشف أشخاصاً</h1>
        <button 
          onClick={() => router.push('/chat')} // يوديك لقائمة الشات اللي فيها أصدقائك
          className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-emerald-600 relative"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          {/* نقطة إشعار وهمية */}
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>
      
      <div className="flex gap-2 mb-8">
        <input 
          placeholder="ابحث عن يوزرنيم..." 
          className="flex-1 p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 ring-emerald-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={searchUsers} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold">بحث</button>
      </div>

      <div className="space-y-4">
        {results.map(person => {
          const iFollowHim = myFollows.includes(person.id);
          const heFollowsMe = followersOfMe.includes(person.id);
          const isFriend = iFollowHim && heFollowsMe;

          return (
            <div key={person.id} className="bg-white p-4 rounded-[25px] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                  {person.image ? <img src={person.image} className="w-full h-full object-cover rounded-full" /> : person.profileName[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{person.profileName}</p>
                  <p className="text-[10px] text-slate-400">@{person.username}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {/* زرار الدردشة يظهر فقط لو أنا متابعه */}
                {iFollowHim && (
                  <button 
                    onClick={() => router.push(`/chat/${person.id}`)}
                    className="p-2 px-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100"
                  >
                    دردشة 💬
                  </button>
                )}

                <button 
                  onClick={() => handleFollow(person.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    iFollowHim ? "bg-slate-100 text-slate-500" : "bg-emerald-600 text-white"
                  }`}
                >
                  {isFriend ? "أصدقاء ✨" : iFollowHim ? "تمت المتابعة" : heFollowsMe ? "رد المتابعة" : "متابعة"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}