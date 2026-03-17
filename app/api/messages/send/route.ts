import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, text, type, mediaUrl, callId } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: "المرسل والمستقبل مطلوبان" }, { status: 400 });
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
      include: {
        sender: {
          select: { id: true, profileName: true, image: true },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (err: any) {
    console.error("❌ Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}