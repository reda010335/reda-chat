import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, text, type, mediaUrl } = body;

    // تحقق من البيانات الأساسية
    if (!senderId || !receiverId) {
      return NextResponse.json({ error: "لازم المرسل والمستقبل" }, { status: 400 });
    }

    if (!text?.trim() && !mediaUrl) {
      return NextResponse.json({ error: "مفيش محتوى للرسالة" }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: text?.trim() || "",
        mediaUrl: mediaUrl || null, // رابط الصورة/الفيديو/الصوت
        delivered: true,            // تم التسليم
        seen: false,                // لم يتم رؤيته بعد
      },
      include: {
        sender: {
          select: { id: true, profileName: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (err: any) {
    console.error("❌ خطأ في إرسال الرسالة:", err);

    return NextResponse.json(
      {
        error: "فشل الإرسال: " + (err.message.includes("foreign key") ? "المستخدم غير موجود" : err.message),
      },
      { status: 500 }
    );
  }
}