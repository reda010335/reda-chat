"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  profileName: string;
};

type Conversation = {
  id: string;
  otherUser: User;
};

export default function ChatListPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    loadConversations();
  }, [currentUser]);

  async function loadConversations() {
    try {
      const res = await fetch(`/api/conversations?userId=${currentUser?.id}`);

      if (!res.ok) {
        console.log("API error");
        return;
      }

      const text = await res.text();

      if (!text) {
        setConversations([]);
        return;
      }

      const data = JSON.parse(text);
      setConversations(data);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">

        {/* HEADER */}
        <header className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900 text-right">
            الدردشات
          </h1>
        </header>

        {/* LIST */}
        <div className="divide-y divide-slate-200">

          {conversations.length === 0 && (
            <p className="p-6 text-center text-slate-500">
              لا توجد محادثات
            </p>
          )}

          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="flex w-full items-center gap-3 p-4 hover:bg-slate-50"
            >

              {/* AVATAR */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {chat?.otherUser?.profileName?.charAt(0) || "?"}
              </div>

              {/* NAME */}
              <div className="flex-1 text-right">
                <p className="font-bold text-slate-900">
                  {chat?.otherUser?.profileName || "مستخدم"}
                </p>

                <p className="text-xs text-slate-500">
                  @{chat?.otherUser?.username || ""}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* NAVIGATION */}
        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white py-2">
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center text-slate-500"
          >
            🏠
            <span className="text-xs">الرئيسية</span>
          </button>

          <button className="flex flex-col items-center text-slate-500">
            👥
            <span className="text-xs">الأصدقاء</span>
          </button>

          <button className="flex flex-col items-center text-emerald-600">
            💬
            <span className="text-xs">الدردشات</span>
          </button>

          <button className="flex flex-col items-center text-slate-500">
            ➕
            <span className="text-xs">إنشاء</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("currentUser");
              router.push("/");
            }}
            className="flex flex-col items-center text-slate-500"
          >
            ⚙️
            <span className="text-xs">خروج</span>
          </button>
        </nav>

      </div>
    </div>
  );
}