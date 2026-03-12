"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id?: string;
  username: string;
  password: string;
  profileName: string;
  createdAt?: string;
};

type Post = {
  id: number;
  author: string;
  time: string;
  text: string;
};

type Story = {
  id: number;
  name: string;
};

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [posts] = useState<Post[]>([
    {
      id: 1,
      author: "Ahmed Ali",
      time: "منذ 5 دقائق",
      text: "أول منشور في REDA CHAT 🔥",
    },
    {
      id: 2,
      author: "Sara Mohamed",
      time: "منذ 20 دقيقة",
      text: "الواجهة الجديدة بدأت تبقى شكلها ممتاز جدًا.",
    },
  ]);

  const [stories] = useState<Story[]>([
    { id: 1, name: "أحمد" },
    { id: 2, name: "سارة" },
    { id: 3, name: "منى" },
    { id: 4, name: "يوسف" },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const clearForm = () => {
    setUsername("");
    setPassword("");
    setProfileName("");
  };

  const handleRegister = async () => {
    if (!username || !password || !profileName) {
      setMessage("من فضلك املأ كل البيانات");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          profileName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "حدث خطأ أثناء إنشاء الحساب");
        return;
      }

      setCurrentUser(data.user);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      clearForm();
    } catch {
      setMessage("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("من فضلك اكتب اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "بيانات الدخول غير صحيحة");
        return;
      }

      setCurrentUser(data.user);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      clearForm();
    } catch {
      setMessage("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setMode("login");
  };

  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="REDA CHAT Logo"
                  className="h-11 w-11 object-contain"
                />
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    REDA CHAT
                  </h1>
                  <p className="text-xs text-slate-500">
                    أهلاً {currentUser.profileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                  🔍
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                  🔔
                </button>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {currentUser.profileName.charAt(0)}
              </div>

              <input
                placeholder="بم تفكر؟"
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-right text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className="rounded-2xl bg-slate-100 py-2 text-sm font-semibold text-slate-700">
                📷 صورة
              </button>
              <button className="rounded-2xl bg-slate-100 py-2 text-sm font-semibold text-slate-700">
                ✍️ منشور
              </button>
              <button className="rounded-2xl bg-slate-100 py-2 text-sm font-semibold text-slate-700">
                ⚡ ستوري
              </button>
            </div>
          </section>

          <section className="mt-2 border-b border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">الستوري</h2>
              <button className="text-sm font-semibold text-emerald-600">
                عرض الكل
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              <div className="flex h-36 min-w-[95px] flex-col items-center justify-center rounded-3xl bg-slate-100 text-center shadow-sm">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
                  +
                </div>
                <p className="text-sm font-bold text-slate-700">إنشاء</p>
                <p className="text-xs text-slate-500">ستوري</p>
              </div>

              {stories.map((story) => (
                <div
                  key={story.id}
                  className="relative h-36 min-w-[95px] overflow-hidden rounded-3xl bg-gradient-to-b from-slate-700 to-slate-900 p-3 text-white shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-500 font-bold">
                    {story.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-3 right-3 left-3">
                    <p className="text-sm font-bold">{story.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 p-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">
                      {post.author.charAt(0)}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{post.author}</p>
                      <p className="text-xs text-slate-500">{post.time}</p>
                    </div>
                  </div>

                  <p className="mb-4 text-right leading-7 text-slate-800">
                    {post.text}
                  </p>

                  <div className="h-56 rounded-2xl bg-slate-200" />

                  <div className="mt-4 flex items-center justify-around border-t border-slate-200 pt-3 text-sm font-semibold text-slate-600">
                    <button>❤️ إعجاب</button>
                    <button>💬 تعليق</button>
                    <button>↩ مشاركة</button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white py-2">
            <button className="flex flex-col items-center gap-1 text-emerald-600">
              <span className="text-xl">🏠</span>
              <span className="text-xs font-bold">الرئيسية</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-slate-500">
              <span className="text-xl">👥</span>
              <span className="text-xs font-bold">الأصدقاء</span>
            </button>

            <button
              onClick={() => router.push("/chat")}
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <span className="text-xl">💬</span>
              <span className="text-xs font-bold">الدردشات</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-slate-500">
              <span className="text-xl">➕</span>
              <span className="text-xs font-bold">إنشاء</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <span className="text-xl">⚙️</span>
              <span className="text-xs font-bold">خروج</span>
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
          <div>
            <img
              src="/logo.png"
              alt="REDA CHAT Logo"
              className="mb-6 h-20 w-20 object-contain"
            />

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              REDA CHAT
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              منصة تواصل اجتماعي حديثة بتصميم احترافي، جاهزة تتحول بعد كده
              لمشروع حقيقي فيه حسابات، أصدقاء، شات، منشورات، وستوري.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="font-bold">واجهة حديثة</p>
              <p className="mt-2 text-sm text-slate-300">تصميم أنضف وأوضح</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/20 p-4">
              <p className="font-bold">بداية قوية</p>
              <p className="mt-2 text-sm text-slate-200">
                تسجيل دخول وإنشاء حساب
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/logo.png"
              alt="REDA CHAT Logo"
              className="mx-auto mb-4 h-20 w-20 object-contain"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              REDA CHAT
            </h1>
          </div>

          <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`w-1/2 rounded-2xl py-3 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              className={`w-1/2 rounded-2xl py-3 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500"
              }`}
            >
              إنشاء حساب
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-right text-sm font-semibold text-slate-700">
                  اسم البروفايل
                </label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="اكتب اسمك الظاهر"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-right text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-right text-sm font-semibold text-slate-700">
                اسم المستخدم
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اكتب اسم المستخدم"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-right text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-right text-sm font-semibold text-slate-700">
                كلمة المرور
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="اكتب كلمة المرور"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-right text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {message}
              </div>
            )}

            {mode === "login" ? (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-500 py-3.5 font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {loading ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 py-3.5 font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            دي الصفحة الرئيسية بعد آخر تحديثات REDA CHAT.
          </p>
        </div>
      </div>
    </div>
  );
}