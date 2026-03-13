import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, profileName } = body;

    // 1. التأكد من البيانات
    if (!username || !password) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // 2. التأكد من عدم تكرار اليوزر
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 400 });
    }

    // 3. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. إنشاء المستخدم (Prisma هتعمل الـ UUID تلقائياً)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        profileName: profileName || username,
      },
    });

    return NextResponse.json({ message: "تم إنشاء الحساب بنجاح", userId: user.id }, { status: 201 });

  } catch (error: any) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}