import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, profileName } = body;

    if (!username || !password || !profileName) {
      return NextResponse.json(
        { error: "من فضلك املأ كل البيانات" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "اسم المستخدم مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        username,
        password,
        profileName,
      },
    });

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}