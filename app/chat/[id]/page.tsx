"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SavedUser = {
  id: string;
  username: string;
  profileName: string;
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    profileName: string;
  };
};

type ConversationItem = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    profileName: string;
  };
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = String(params.id);

  const [currentUser, setCurrentUser] = useState<SavedUser | null>(null);
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    loadConversation();
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, conversationId]);

  async function loadConversation() {
    if (!currentUser?.id) return;

    try {
      const res = await fetch(`/api/conversations?userId=${currentUser.id}`);

      if (!res.ok) {
        console.log("فشل في تحميل المحادثات");
        return;
      }

      const textResponse = await res.text();

      if (!textResponse) {
        console.log("الرد فاضي من conversations");
        return;
      }

      const data = JSON.parse(textResponse);

      const found = data.find((item: ConversationItem) => item.id === conversationId);

      if (found) {
        setConversation(found);
      }
    } catch (error) {
      console.log("خطأ في loadConversation", error);
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);

      if (!res.ok) {
        console.log("فشل في تحميل الرسائل");
        return;
      }

      const textResponse = await res.text();

      if (!textResponse) {
        setMessages([]);
        return;
      }

      const data = JSON.parse(textResponse);
      setMessages(data);
    } catch (error) {
      console.log("خطأ في loadMessages", error);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !currentUser?.id) return;

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          senderId: currentUser.id,
          text,
        }),
      });

      if (!res.ok) {
        console.log("فشل في إرسال الرسالة");
        return;
      }

      setText("");
      loadMessages();
    } catch (error) {
      console.log("خطأ في sendMessage", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#efeae2]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#efeae2] shadow-xl">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="text-2xl text-slate-700"
            >
              ←
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
              {conversation?.otherUser?.profileName?.charAt(0) || "?"}
            </div>

            <div className="text-right">
              <h1 className="text-base font-bold text-slate-900">
                {conversation?.otherUser?.profileName || "المحادثة"}
              </h1>
              <p className="text-xs text-slate-500">
                @{conversation?.otherUser?.username || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xl text-slate-700">
            <button>📞</button>
            <button>📹</button>
            <button>⋮</button>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === currentUser?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.senderId === currentUser?.id
                    ? "bg-emerald-100 text-right"
                    : "bg-white text-right"
                }`}
              >
                <p className="text-sm text-slate-800">{msg.text}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {!messages.length && (
            <p className="text-center text-sm text-slate-500">
              لا توجد رسائل بعد
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالة"
              className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-right outline-none"
            />

            <button
              onClick={sendMessage}
              className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-white"
            >
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}