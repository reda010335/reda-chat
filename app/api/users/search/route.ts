import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    
    if (!q) return NextResponse.json([]);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // البحث في Prisma
    const users = await prisma.user.findMany({
      where: {
        // البحث عن الاسم أو اليوزر نيم
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { profileName: { contains: q, mode: "insensitive" } },
        ],
        // استثناء المستخدم الحالي لو مسجل دخول
        NOT: currentUser ? { id: currentUser.id } : undefined,
      },
      select: {
        id: true,
        username: true,
        profileName: true,
      },
      take: 10, // خليها 10 عشان الموبايل ميهنجش في عرض النتائج
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("❌ Search Error:", error.message);
    return NextResponse.json({ error: "خطأ في البحث" }, { status: 500 });
  }
}
