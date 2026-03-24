import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET: List all departments (any authenticated user)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error("Fetch departments error:", error);
    return NextResponse.json({ success: false, error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

// POST: Create a new department (admin only)
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

    const { name, color } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Bitte einen Abteilungsnamen eingeben." }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 50);

    const existing = await prisma.department.findUnique({ where: { name: cleanName } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Eine Abteilung mit diesem Namen existiert bereits." }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        name: cleanName,
        headId: "",
        color: color || "bg-gray-100 text-gray-700 border-gray-200",
      },
    });

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json({ success: false, error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

// PUT: Update a department (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Keine Berechtigung." }, { status: 403 });
    }

    const { id, name, headId, color } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Abteilungs-ID fehlt." }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Abteilung nicht gefunden." }, { status: 404 });
    }

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = String(name).trim().slice(0, 50);
    if (headId !== undefined) data.headId = String(headId);
    if (color !== undefined) data.color = String(color);

    const department = await prisma.department.update({ where: { id }, data });

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json({ success: false, error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

// DELETE: Delete a department (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Keine Berechtigung." }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Abteilungs-ID fehlt." }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Abteilung nicht gefunden." }, { status: 404 });
    }

    // Move users in this department to "Ohne Abteilung"
    await prisma.user.updateMany({
      where: { department: existing.name },
      data: { department: "Ohne Abteilung", managerId: null },
    });

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json({ success: false, error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
