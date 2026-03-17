import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, profileName: true, image: true },
        },
        receiver: {
          select: { id: true, username: true, profileName: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const recent = new Map<
      string,
      {
        otherUser: {
          id: string;
          username: string;
          profileName: string;
          image: string | null;
        };
        lastMessage: string;
      }
    >();

    for (const message of messages) {
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;

      if (!recent.has(otherUser.id)) {
        recent.set(otherUser.id, {
          otherUser,
          lastMessage: message.content,
        });
      }
    }

    return NextResponse.json(Array.from(recent.values()));
  } catch (error: any) {
    console.error("GET /api/messages/recent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load recent messages" },
      { status: 500 }
    );
  }
}
