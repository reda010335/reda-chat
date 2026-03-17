import type { Metadata } from "next";
import BottomNav from "@/app/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "REDA CHAT",
  description: "Modern social chat experience built with Next.js, Supabase, and Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f3_100%)] pb-32 antialiased dark:bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
