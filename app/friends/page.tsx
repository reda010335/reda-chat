"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function FriendsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!searchTerm) return;
    setLoading(true);
    // البحث عن يوزر بالاسم أو اليوزرنيم
    const { data } = await supabase
      .from("User")
      .select("*")
      .ilike("username", `%${searchTerm}%`);
    
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4" dir="rtl">
      <h1 className="text-2xl font-black mb-6">إضافة أصدقاء</h1>
      
      <div className="flex gap-2 mb-8">
        <input 
          placeholder="ابحث عن يوزرنيم..." 
          className="flex-1 p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 ring-emerald-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={searchUsers} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold">بحث</button>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-center">جاري البحث...</p>}
        {results.map(person => (
          <div key={person.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                {person.profileName[0]}
              </div>
              <div>
                <p className="font-bold">{person.profileName}</p>
                <p className="text-xs text-slate-400">@{person.username}</p>
              </div>
            </div>
            <button className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm">إضافة</button>
          </div>
        ))}
      </div>
    </div>
  );
}