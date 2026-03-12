import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    // إذا لم يتم إرسال معرف المحادثة، نرجع مصفوفة فارغة
    if (!conversationId) {
      return NextResponse.json([]);
    }

    // جلب الرسائل من قاعدة البيانات
    // ملاحظة: تأكد من تشغيل npx prisma generate ليتعرف Prisma على 'messages' أو 'message'
    const messages = await prisma.messages.findMany({
      where: {
        conversationId: conversationId, // سيتم التعامل معه كـ UUID تلقائياً
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
      orderBy: {
        createdAt: "asc", // ترتيب من الأقدم للأحدث لسهولة القراءة في الشات
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("جلب الرسائل - خطأ:", error);
    // في حالة الخطأ نرجع مصفوفة فارغة لضمان عدم توقف واجهة المستخدم
    return NextResponse.json([]);
  }
}