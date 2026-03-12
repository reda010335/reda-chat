import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profileName: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            profileName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const result = conversations.map((conversation) => {
      const otherUser =
        conversation.user1Id === userId ? conversation.user2 : conversation.user1;

      const lastMessage = conversation.messages[0] || null;

      return {
        id: conversation.id,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              username: otherUser.username,
              profileName: otherUser.profileName,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.log("conversations error:", error);
    return NextResponse.json([]);
  }
}