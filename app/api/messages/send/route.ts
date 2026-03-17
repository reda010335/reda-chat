import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, text, type, mediaUrl, callId } = body;

    // 1. التحقق من البيانات
    if (!senderId || !receiverId) {
      return NextResponse.json({ error: "المرسل والمستقبل مطلوبان" }, { status: 400 });
    }

    // 2. إنشاء الرسالة (استخدام الأسماء المطابقة للـ Schema)
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: text?.trim() || "",
        mediaUrl: mediaUrl || null,
        callId: callId || null,
        delivered: true,
        seen: false,
      },
      include: {
        sender: {
          select: { id: true, profileName: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (err: any) {
    console.error("❌ Error sending message:", err);
    return NextResponse.json(
      { error: "فشل الإرسال: " + err.message },
      { status: 500 }
    );
  }
}