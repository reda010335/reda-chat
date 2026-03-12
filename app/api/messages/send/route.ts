import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, senderId, text } = body;

    // التأكد من وجود البيانات المطلوبة
    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json(
        { error: "بيانات الرسالة غير مكتملة" },
        { status: 400 }
      );
    }

    // إنشاء الرسالة في جدول Messages (الاسم الجديد بالجمع حسب السكيما)
    const message = await prisma.messages.create({
      data: {
        conversationId, // UUID
        senderId,       // UUID
        content: text.trim(), // غيرنا text لـ content حسب الـ Schema الأخيرة
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

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("send route error:", error);
    
    // رسالة خطأ واضحة في حالة وجود مشكلة في الـ UUID أو العلاقات
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الرسالة. تأكد من صحة المعرفات (UUID)" },
      { status: 500 }
    );
  }
}