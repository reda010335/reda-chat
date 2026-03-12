import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, senderId, text } = body;

    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json(
        { error: "conversationId و senderId و text مطلوبين" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text: text.trim(),
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
  } catch (error) {
    console.log("send route error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الرسالة" },
      { status: 500 }
    );
  }
}