import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const vacations = await prisma.vacationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const cancelRequests = await prisma.vacationCancelRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      vacations: vacations.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
      cancelRequests: cancelRequests.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch vacations error:", error);
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
      const { userId, startDate, endDate, days, type, reason } = body;
      const vacation = await prisma.vacationRequest.create({
        data: { userId, startDate, endDate, days, type, reason, status: "ausstehend" },
      });
      return NextResponse.json({ success: true, vacation: { ...vacation, createdAt: vacation.createdAt.toISOString() } });
    }

    if (action === "approve") {
      const { id } = body;
      const vacation = await prisma.vacationRequest.update({
        where: { id },
        data: { status: "genehmigt", approvedBy: session.user.id, approvedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, vacation: { ...vacation, createdAt: vacation.createdAt.toISOString() } });
    }

    if (action === "reject") {
      const { id } = body;
      const vacation = await prisma.vacationRequest.update({
        where: { id },
        data: { status: "abgelehnt", approvedBy: session.user.id, approvedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, vacation: { ...vacation, createdAt: vacation.createdAt.toISOString() } });
    }

    if (action === "cancel-request") {
      const { vacationId, userId, reason } = body;
      const cancel = await prisma.vacationCancelRequest.create({
        data: { vacationId, userId, reason, status: "ausstehend" },
      });
      return NextResponse.json({ success: true, cancelRequest: { ...cancel, createdAt: cancel.createdAt.toISOString() } });
    }

    if (action === "cancel-approve") {
      const { cancelId } = body;
      const cancel = await prisma.vacationCancelRequest.update({
        where: { id: cancelId },
        data: { status: "genehmigt", decidedBy: session.user.id, decidedAt: new Date().toISOString() },
      });
      // Also reject the vacation
      await prisma.vacationRequest.update({
        where: { id: cancel.vacationId },
        data: { status: "abgelehnt" },
      });
      return NextResponse.json({ success: true, cancelRequest: { ...cancel, createdAt: cancel.createdAt.toISOString() } });
    }

    if (action === "cancel-reject") {
      const { cancelId } = body;
      const cancel = await prisma.vacationCancelRequest.update({
        where: { id: cancelId },
        data: { status: "abgelehnt", decidedBy: session.user.id, decidedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, cancelRequest: { ...cancel, createdAt: cancel.createdAt.toISOString() } });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("Vacation action error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
