import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // استخدم النسخة الموحدة من بريزما
import { createBrowserClient } from "@supabase/ssr"; // أو النوع المناسب حسب مكان الاستخدام

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, profileName, supabaseUserId } = body;

    // 1. التأكد من البيانات
    if (!username || !password) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // 2. فحص هل المستخدم موجود في Prisma قبل أي شيء
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 400 });
    }

    // 3. ملاحظة مهمة: التسجيل في Supabase Auth يفضل يتم من الـ Client 
    // لكن لو بعت الـ UUID من الفرونت إند بعد نجاح التسجيل هناك:
    
    if (!supabaseUserId) {
       return NextResponse.json({ error: "يجب توفر معرف Supabase" }, { status: 400 });
    }

    // 4. إنشاء المستخدم في Prisma باستخدام الـ ID القادم من سوبابيز
    const user = await prisma.user.create({
      data: {
        id: supabaseUserId, // نستخدم الـ ID بتاع سوبابيز عشان الربط
        username: username.trim().toLowerCase(),
        password: password, // في الغالب سوبابيز بتدير الباسورد فممكن تخلي الحقل ده اختياري أو تحفظه كـ placeholder
        profileName: profileName || username,
      },
    });

    return NextResponse.json({ 
        message: "تم حفظ بيانات البروفايل بنجاح", 
        user 
    }, { status: 201 });

  } catch (error: any) {
    console.error("REGISTER_ERROR:", error.message);
    return NextResponse.json({ error: "حدث خطأ: " + error.message }, { status: 500 });
  }
}
