import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    const currentUserId = req.nextUrl.searchParams.get("currentUserId") || "";

    if (!q) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          currentUserId ? { id: { not: currentUserId } } : {},
          {
            OR: [
              {
                username: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                profileName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        profileName: true,
      },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.log(error);
    return NextResponse.json([]);
  }
}