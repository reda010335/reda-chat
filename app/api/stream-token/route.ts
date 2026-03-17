import { NextRequest, NextResponse } from "next/server";

// استخدم secret key بتاع Stream من .env
const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId missing" }, { status: 400 });

  const payload = {
    user_id: userId
  };

  // نستخدم fetch لإنشاء Stream Token
  const res = await fetch("https://video.stream-io-api.com/video/token", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STREAM_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return NextResponse.json(data);
}