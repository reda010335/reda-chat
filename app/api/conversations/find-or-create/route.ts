import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { currentUserId, targetUserId } = await req.json();

    if (!currentUserId || !targetUserId) {
      return NextResponse.json(
        { error: "currentUserId و targetUserId مطلوبين" },
        { status: 400 }
      );
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUserId,
            user2Id: targetUserId,
          },
          {
            user1Id: targetUserId,
            user2Id: currentUserId,
          },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: targetUserId,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("Conversation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء معالجة المحادثة" },
      { status: 500 }
    );
  }
}
