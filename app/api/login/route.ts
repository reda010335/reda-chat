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

    // 1. الحل هنا: لازم ننتظر الـ cookies() لأنها أصبحت Promise
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
            // ملاحظة: الـ Server Actions و الـ Route Handlers بتسمح بالـ set عادي
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // 2. تسجيل الدخول عبر Supabase Auth
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

    // 3. جلب بيانات البروفايل من Prisma باستخدام الـ UUID
    const userProfile = await prisma.user.findUnique({
      where: { id: authData.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "لم يتم العثور على بروفايل مرتبط" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      user: userProfile,
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}