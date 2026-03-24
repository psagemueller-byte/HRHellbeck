import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const reports = await prisma.disruptionReport.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reports: reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch disruptions error:", error);
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
      const { category, title, description, location, imageUrls, assignedTo } = body;
      const report = await prisma.disruptionReport.create({
        data: {
          reporterId: session.user.id,
          category,
          title,
          description,
          location,
          imageUrls: imageUrls || [],
          status: "offen",
          assignedTo,
        },
      });
      return NextResponse.json({ success: true, report: { ...report, createdAt: report.createdAt.toISOString() } });
    }

    if (action === "update-status") {
      const { id, status } = body;
      const report = await prisma.disruptionReport.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, report: { ...report, createdAt: report.createdAt.toISOString() } });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("Disruption action error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
