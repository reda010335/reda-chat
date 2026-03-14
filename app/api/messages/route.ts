import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // بنجيب الرسايل بناءً على اليوزر
    const receiverId = searchParams.get("receiverId");

    if (!userId || !receiverId) {
      return NextResponse.json([]);
    }

    // التعديل هنا: بنستخدم prisma.message (بالمفرد)
    // وبندور بالمرسل والمستقبل لأن مفيش conversationId
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            username: true,
            profileName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("❌ خطأ في جلب الرسائل:", error.message);
    return NextResponse.json([]);
  }
}
