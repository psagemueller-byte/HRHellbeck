import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const protocols = await prisma.handoverProtocol.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      protocols: protocols.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch handovers error:", error);
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
    const { shiftDate, shiftType, machineStatus, openTasks, incidents, notes } = body;

    const protocol = await prisma.handoverProtocol.create({
      data: {
        authorId: session.user.id,
        shiftDate,
        shiftType,
        machineStatus,
        openTasks,
        incidents,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      protocol: { ...protocol, createdAt: protocol.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("Handover create error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
