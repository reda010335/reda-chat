"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // البحث في جدول User عن طريق الاسم
    const { data, error } = await supabase
      .from("User")
      .select("id, username, profileName")
      .ilike("profileName", `%${query}%`);

    if (error) {
      console.error("خطأ في البحث:", error.message);
      return;
    }
    setResults(data || []);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl" dir="rtl">
      <header className="p-4 border-b flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-100 rounded-full">➡️</button>
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="ابحث عن أصدقاء..." 
          className="flex-1 bg-slate-100 p-3 rounded-2xl outline-none border focus:border-emerald-500 transition-all"
        />
        <button onClick={handleSearch} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold">بحث</button>
      </header>

      <div className="p-4 space-y-3">
        {results.length === 0 && query && <p className="text-center text-slate-400 text-sm mt-10">لم يتم العثور على مستخدمين بهذا الاسم</p>}
        {results.map((user) => (
          <div 
            key={user.id} 
            onClick={() => router.push(`/chat/${user.id}`)}
            className="flex items-center justify-between p-4 border rounded-2xl active:scale-95 transition-transform cursor-pointer hover:bg-slate-50 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-tr from-emerald-400 to-teal-600 text-white flex items-center justify-center font-black text-xl border-2 border-white shadow-sm">
                {user.profileName[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800">{user.profileName}</p>
                <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
              </div>
            </div>
            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-lg">مراسلة</span>
          </div>
        ))}
      </div>
    </div>
  );
}