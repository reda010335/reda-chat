import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REDA CHAT",
  description: "Chat App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased relative pb-32">
        {/* هنا محتوى الصفحات */}
        {children}

        {/* NavBar ثابت */}
        <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[30px] border border-white/20 shadow-xl flex justify-around items-center px-4 z-[100]">
          <NavBtn icon="🏠" href="/" />
          <NavBtn icon="👥" href="/friends" />
          <NavBtn icon="💬" href="/chat" />
          <NavBtn icon="👤" href="/profile" />
        </nav>
      </body>
    </html>
  );
}

function NavBtn({ icon, href }: { icon: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-slate-400 transition-all hover:bg-emerald-600 hover:text-white"
    >
      <span className="text-2xl">{icon}</span>
    </a>
  );
}