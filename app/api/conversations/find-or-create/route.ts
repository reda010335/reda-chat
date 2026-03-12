import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { currentUserId, targetUserId } = await req.json();

    // التأكد من وجود البيانات المطلوبة
    if (!currentUserId || !targetUserId) {
      return NextResponse.json(
        { error: "currentUserId و targetUserId مطلوبين" },
        { status: 400 }
      );
    }

    // 1. البحث عن محادثة قائمة بين الطرفين
    // ملاحظة: Prisma هيتعامل مع الـ UUID تلقائياً طالما الـ Schema صحيحة
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { 
            user1Id: currentUserId, 
            user2Id: targetUserId 
          },
          { 
            user1Id: targetUserId, 
            user2Id: currentUserId 
          },
        ],
      },
    });

    // 2. إذا لم توجد محادثة، نقوم بإنشائها
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: targetUserId,
        },
      });
    }

    return NextResponse.json(conversation);
    
  } catch (error: any) {
    console.error("خطأ في المحادثة:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء معالجة المحادثة" },
      { status: 500 }
    );
  }
}