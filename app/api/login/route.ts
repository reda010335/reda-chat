import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "من فضلك اكتب اسم المستخدم وكلمة المرور" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const email = `${username.trim().toLowerCase()}@redachat.com`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    // --- التعديل الجوهري هنا ---
    // بنحاول نجيب البروفايل، ولو مش موجود (لأنه حساب جديد مثلاً) بنعمله Upsert فوراً
    let userProfile = await prisma.user.findUnique({
      where: { id: authData.user.id },
    });

    if (!userProfile) {
      // لو الحساب موجود في Supabase بس مش موجود في Prisma، بنضيفه دلوقتي
      userProfile = await prisma.user.create({
        data: {
          id: authData.user.id,
          username: username.trim().toLowerCase(),
          profileName: username.trim(), // اسم افتراضي
        },
      });
    }

    return NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      user: userProfile,
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر: " + error.message },
      { status: 500 }
    );
  }
}
