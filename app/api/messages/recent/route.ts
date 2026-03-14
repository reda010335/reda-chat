import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: "desc" }
  });

  const recent = new Map();
  messages.forEach(m => {
    const other = m.senderId === userId ? m.receiver : m.sender;
    if (!recent.has(other.id)) {
      recent.set(other.id, { otherUser: other, lastMessage: m.content });
    }
  });
  return NextResponse.json(Array.from(recent.values()));
}