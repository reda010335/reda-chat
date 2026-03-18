"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/", icon: "Home", emoji: "🏠" },
  { href: "/friends", icon: "Friends", emoji: "👥" },
  { href: "/chat", icon: "Chat", emoji: "💬" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const [profileHref, setProfileHref] = useState("/signup");

  const hiddenRoutes = ["/signup"];
  const hiddenPrefixes = ["/chat/", "/call/"];

  const shouldHide =
    hiddenRoutes.includes(pathname) ||
    hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setProfileHref(user ? `/profile/${user.id}` : "/signup");
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  if (shouldHide) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-2xl items-center justify-around rounded-[28px] border border-white/60 bg-white/90 px-3 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
      {navItems.map((item) => (
        <NavBtn
          key={item.href}
          href={item.href}
          icon={item.icon}
          emoji={item.emoji}
          isActive={pathname === item.href}
        />
      ))}

      <NavBtn
        href={profileHref}
        icon="Profile"
        emoji="👤"
        isActive={pathname.startsWith("/profile/")}
      />
    </nav>
  );
}

function NavBtn({
  href,
  icon,
  emoji,
  isActive,
}: {
  href: string;
  icon: string;
  emoji: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={icon}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all ${
        isActive
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none"
          : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span>{emoji}</span>
    </Link>
  );
}
