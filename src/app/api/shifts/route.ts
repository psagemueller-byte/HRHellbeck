import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const shifts = await prisma.shiftEntry.findMany();

    return NextResponse.json({ success: true, shifts });
  } catch (error) {
    console.error("Fetch shifts error:", error);
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

    if (action === "create") {
      const { userId, date, type, startTime, endTime, note, createdBy } = body;
      const shift = await prisma.shiftEntry.create({
        data: { userId, date, type, startTime, endTime, note, createdBy: createdBy || session.user.id },
      });
      return NextResponse.json({ success: true, shift });
    }

    if (action === "update") {
      const { id, ...data } = body;
      delete data.action;
      const shift = await prisma.shiftEntry.update({ where: { id }, data });
      return NextResponse.json({ success: true, shift });
    }

    if (action === "delete") {
      const { id } = body;
      await prisma.shiftEntry.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("Shift action error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
