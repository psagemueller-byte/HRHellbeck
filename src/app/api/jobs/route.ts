import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      jobs: jobs.map((j) => ({ ...j, createdAt: j.createdAt.toISOString() })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Fehler";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Keine Berechtigung." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { title, department, location, type, description, requirements, benefits, contactEmail } = body;
      const job = await prisma.jobPosting.create({
        data: { title, department, location: location || "", type: type || "vollzeit", description, requirements, benefits, contactEmail: contactEmail || "", createdBy: session.user.id },
      });
      return NextResponse.json({ success: true, job: { ...job, createdAt: job.createdAt.toISOString() } });
    }

    if (action === "update") {
      const { id, ...data } = body;
      const job = await prisma.jobPosting.update({ where: { id }, data });
      return NextResponse.json({ success: true, job: { ...job, createdAt: job.createdAt.toISOString() } });
    }

    if (action === "delete") {
      await prisma.jobPosting.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    }

    if (action === "toggle-active") {
      const job = await prisma.jobPosting.findUnique({ where: { id: body.id } });
      if (!job) return NextResponse.json({ success: false, error: "Nicht gefunden." }, { status: 404 });
      const updated = await prisma.jobPosting.update({ where: { id: body.id }, data: { isActive: !job.isActive } });
      return NextResponse.json({ success: true, job: { ...updated, createdAt: updated.createdAt.toISOString() } });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Fehler";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
