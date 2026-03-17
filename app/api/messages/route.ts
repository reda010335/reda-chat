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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, text, type, mediaUrl, callId } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: "المرسل والمستقبل مطلوبان" },
        { status: 400 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: text?.trim() || "",
        type: type || "text",
        mediaUrl: mediaUrl || null,
        callId: callId || null,
      },
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء إرسال الرسالة" },
      { status: 500 }
    );
  }
}
