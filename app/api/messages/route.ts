import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const receiverId = searchParams.get("receiverId");

    if (!userId || !receiverId) {
      return NextResponse.json(
        { error: "userId و receiverId مطلوبان" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء جلب الرسائل" },
      { status: 500 }
    );
  }
}
