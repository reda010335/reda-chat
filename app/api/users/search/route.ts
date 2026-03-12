import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    
    // 1. جلب بيانات المستخدم الحالي من Supabase Auth للتأكد من هويته
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

    if (!q) {
      return NextResponse.json([]);
    }

    // 2. البحث في قاعدة البيانات
    const users = await prisma.user.findMany({
      where: {
        AND: [
          // لو المستخدم مسجل دخول، استثنيه من النتائج
          currentUser ? { id: { not: currentUser.id } } : {},
          {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { profileName: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        profileName: true,
      },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}