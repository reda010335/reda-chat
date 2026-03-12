import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json([]);

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, username: true, profileName: true } },
        user2: { select: { id: true, username: true, profileName: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      otherUser: conv.user1Id === userId ? conv.user2 : conv.user1,
      lastMessage: conv.messages[0]?.content || "ابدأ المحادثة الآن",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}