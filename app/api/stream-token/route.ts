import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

const serverClient = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId missing" }, { status: 400 });

  // توليد JWT Token للمستخدم
  const token = serverClient.createToken(userId);

  return NextResponse.json({ token });
}