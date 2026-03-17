import crypto from "crypto";
import { NextResponse } from "next/server";

const apiSecret = process.env.STREAM_SECRET_KEY!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const payload = {
    user_id: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
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

  return NextResponse.json({ token: `${token}.${signature}` });
}
