import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, profileName, supabaseUserId } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "Supabase user id is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        id: supabaseUserId,
        username: normalizedUsername,
        password,
        profileName: profileName || username,
      },
    });

    return NextResponse.json(
      {
        message: "Profile saved successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER_ERROR:", error.message);
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}
