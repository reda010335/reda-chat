import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId مطلوب" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profileName: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profileName: true,
            image: true,
          },
        },
      },
    });

    const seen = new Set<string>();
    const conversations = [];

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!otherUser || seen.has(otherUser.id)) {
        continue;
      }

      seen.add(otherUser.id);

      conversations.push({
        otherUser,
        lastMessage: msg.content || "Start the conversation now",
      });
    }

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("GET /api/messages/recent error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء جلب الرسائل" },
      { status: 500 }
    );
  }
}
