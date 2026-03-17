import { NextResponse } from "next/server";
import crypto from "crypto";

// بيانات Stream
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const apiSecret = process.env.STREAM_SECRET_KEY!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });

  // هنا بنعمل Token يدوي، حسب docs Stream Video
  // Stream Video uses JWT tokens with HMAC SHA256
  const payload = {
    user_id: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 ساعة صلاحية
  };

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  function base64url(input: string) {
    return Buffer.from(input)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  const token = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(payload)),
  ].join(".");

  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(token)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = token + "." + signature;

  return NextResponse.json({ token: jwt });
}