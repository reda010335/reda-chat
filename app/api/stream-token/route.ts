import { StreamClient } from "@stream-io/node-sdk";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    const secret = process.env.STREAM_SECRET_KEY!;

    const client = new StreamClient(apiKey, secret);

    // إنشاء التوكن للمستخدم
    const token = client.createToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}