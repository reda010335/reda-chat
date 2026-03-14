"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function FriendsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [myFollows, setMyFollows] = useState<string[]>([]); // الناس اللي أنا متابعهم
  const [followersOfMe, setFollowersOfMe] = useState<string[]>([]); // الناس اللي متابعيني
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<any>(null);

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

  // جلب علاقات المتابعة عشان نعرف مين "صديق" ومين "متابعة"
  const fetchRelationships = async (myId: string) => {
    const { data: following } = await supabase.from("Follow").select("followingId").eq("followerId", myId);
    const { data: followers } = await supabase.from("Follow").select("followerId").eq("followingId", myId);
    
    setMyFollows(following?.map(f => f.followingId) || []);
    setFollowersOfMe(followers?.map(f => f.followerId) || []);
  };

  const searchUsers = async () => {
    if (!searchTerm) return;
    setLoading(true);
    const { data } = await supabase
      .from("User")
      .select("*")
      .ilike("username", `%${searchTerm}%`)
      .not("id", "eq", me?.id); // مطلعش نفسي في البحث
    
    setResults(data || []);
    setLoading(false);
  };

  const handleFollow = async (targetId: string) => {
    const isFollowing = myFollows.includes(targetId);

    if (isFollowing) {
      // إلغاء المتابعة
      await supabase.from("Follow").delete().eq("followerId", me.id).eq("followingId", targetId);
    } else {
      // عمل متابعة
      await supabase.from("Follow").insert([{ followerId: me.id, followingId: targetId }]);
      // إرسال إشعار (اختياري)
      await supabase.from("Notification").insert([{ receiverId: targetId, senderId: me.id, type: "follow" }]);
    }
    fetchRelationships(me.id); // تحديث الحالة فوراً
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24" dir="rtl">
      <h1 className="text-2xl font-black mb-6 text-slate-800">اكتشف أشخاصاً</h1>
      
      <div className="flex gap-2 mb-8">
        <input 
          placeholder="ابحث عن صديق..." 
          className="flex-1 p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 ring-emerald-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
        />
        <button onClick={searchUsers} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold transition-transform active:scale-95">بحث</button>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-center animate-pulse text-emerald-600">جاري البحث...</p>}
        
        {results.map(person => {
          const iFollowHim = myFollows.includes(person.id);
          const heFollowsMe = followersOfMe.includes(person.id);
          const isFriend = iFollowHim && heFollowsMe;

          return (
            <div key={person.id} className="bg-white p-4 rounded-[25px] flex items-center justify-between shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 border border-emerald-200 overflow-hidden">
                  {person.image ? <img src={person.image} className="w-full h-full object-cover" /> : person.profileName[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{person.profileName}</p>
                  <p className="text-[10px] text-slate-400">@{person.username}</p>
                </div>
              </div>

              <button 
                onClick={() => handleFollow(person.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  isFriend ? "bg-emerald-600 text-white" : 
                  iFollowHim ? "bg-slate-100 text-slate-500" : 
                  heFollowsMe ? "bg-emerald-100 text-emerald-600" : "bg-emerald-600 text-white"
                }`}
              >
                {isFriend ? "أصدقاء ✨" : 
                 iFollowHim ? "تمت المتابعة" : 
                 heFollowsMe ? "رد المتابعة" : "متابعة"}
              </button>
            </div>
          );
        })}

        {!loading && results.length === 0 && searchTerm && (
          <p className="text-center text-slate-400 text-sm italic">مفيش حد بالاسم ده يا رضا..</p>
        )}
      </div>
    </div>
  );
}