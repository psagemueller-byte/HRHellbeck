import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch chat error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "send") {
      const { receiverId, content } = body;
      const message = await prisma.chatMessage.create({
        data: { senderId: session.user.id, receiverId, content, read: false },
      });
      return NextResponse.json({ success: true, message: { ...message, timestamp: message.timestamp.toISOString() } });
    }

    if (action === "mark-read") {
      const { partnerId } = body;
      await prisma.chatMessage.updateMany({
        where: { senderId: partnerId, receiverId: session.user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("Chat action error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
