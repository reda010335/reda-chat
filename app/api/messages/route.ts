hereimport { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json([]);
    }

    // ملاحظة: لو اسم الجدول عندك في الـ Schema هو Message (بالمفرد) 
    // غير prisma.messages لـ prisma.message
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profileName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    // عرض الخطأ بالتفصيل في الـ Console عشان تعرف لو المشكلة في اسم الجدول
    console.error("❌ خطأ في جلب الرسائل:", error.message);
    
    // نرجع مصفوفة فارغة عشان الـ Frontend ما يضربش (Crash)
    return NextResponse.json([]);
  }
}
