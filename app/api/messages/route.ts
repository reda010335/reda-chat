import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const receiverId = searchParams.get("receiverId");
  if (!userId || !receiverId) return NextResponse.json([]);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { senderId, receiverId, text } = body;
  const newMessage = await prisma.message.create({
    data: { content: text, senderId, receiverId }
  });
  return NextResponse.json(newMessage);
}