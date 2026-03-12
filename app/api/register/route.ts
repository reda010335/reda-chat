import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, profileName } = body;

    // 1. التأكد من إدخال البيانات المطلوبة
    if (!username || !password || !profileName) {
      return NextResponse.json(
        { error: "من فضلك املأ كل البيانات" },
        { status: 400 }
      );
    }

    // 2. إعداد Supabase (التعامل مع الكوكيز في Next.js 15)
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

    // 3. التحقق من أن اسم المستخدم غير مكرر في قاعدة بياناتنا
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "اسم المستخدم مستخدم بالفعل" },
        { status: 400 }
      );
    }

    // 4. إنشاء الحساب في Supabase Auth (الباسورد يتخزن هنا فقط للأمان)
    const email = `${username.trim().toLowerCase()}@redachat.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "فشل إنشاء الحساب في نظام الحماية" },
        { status: 400 }
      );
    }

    // 5. إنشاء سجل المستخدم في Prisma باستخدام الـ UUID الناتج
    const user = await prisma.user.create({
      data: {
        id: authData.user.id, // ربط الـ UUID من Supabase بجدول اليوزر
        username: username.trim(),
        profileName: profileName.trim(),
      },
    });

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ داخلي في السيرفر" },
      { status: 500 }
    );
  }
}