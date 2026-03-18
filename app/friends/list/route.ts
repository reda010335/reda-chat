import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      include: {
        user: {
          select: { id: true, username: true, profileName: true, image: true },
        },
        friend: {
          select: { id: true, username: true, profileName: true, image: true },
        },
      },
      orderBy: { id: "desc" },
    });

    const friendsMap = new Map();

    for (const relation of friendships) {
      const other = relation.userId === userId ? relation.friend : relation.user;
      if (other) {
        friendsMap.set(other.id, other);
      }
    }

    return NextResponse.json(Array.from(friendsMap.values()));
  } catch (error: any) {
    console.error("GET /api/friends/list error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء تحميل الأصدقاء" },
      { status: 500 }
    );
  }
}