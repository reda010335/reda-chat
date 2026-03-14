import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // بناءً على السكيما: محتاجين المرسل والمستقبل والمحتوى
    const { senderId, receiverId, text } = body;

    // التأكد من وجود البيانات المطلوبة حسب السكيما
    if (!senderId || !receiverId || !text?.trim()) {
      return NextResponse.json(
        { error: "بيانات الرسالة غير مكتملة. تأكد من وجود المرسل والمستقبل والنص." },
        { status: 400 }
      );
    }

    // الإنشاء في جدول Message (بالمفرد)
    const newMessage = await prisma.message.create({
      data: {
        content: text.trim(),
        senderId: senderId,   // UUID للمرسل
        receiverId: receiverId, // UUID للمستقبل
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profileName: true,
          },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error("❌ خطأ في إرسال الرسالة:", error.message);
    
    return NextResponse.json(
      { error: "فشل الإرسال: " + (error.message.includes("foreign key") ? "المستخدم غير موجود" : error.message) },
      { status: 500 }
    );
  }
}
