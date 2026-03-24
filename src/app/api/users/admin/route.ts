import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Admin-only user management operations
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    // Verify admin role
    const caller = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ success: false, error: "Keine Berechtigung." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "update-role": {
        const { userId, role } = body;
        if (!userId || !["admin", "autor", "benutzer"].includes(role)) {
          return NextResponse.json({ success: false, error: "Ungültige Parameter." }, { status: 400 });
        }
        const user = await prisma.user.update({
          where: { id: userId },
          data: { role },
          select: { id: true, role: true },
        });
        return NextResponse.json({ success: true, user });
      }

      case "toggle-active": {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId fehlt." }, { status: 400 });
        }
        const current = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
        if (!current) {
          return NextResponse.json({ success: false, error: "Benutzer nicht gefunden." }, { status: 404 });
        }
        const user = await prisma.user.update({
          where: { id: userId },
          data: { isActive: !current.isActive },
          select: { id: true, isActive: true },
        });
        return NextResponse.json({ success: true, user });
      }

      case "remove-user": {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId fehlt." }, { status: 400 });
        }
        if (userId === session.user.id) {
          return NextResponse.json({ success: false, error: "Eigenen Account kann man nicht löschen." }, { status: 400 });
        }
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
      }

      case "update-vacation-days": {
        const { userId, days } = body;
        if (!userId || typeof days !== "number") {
          return NextResponse.json({ success: false, error: "Ungültige Parameter." }, { status: 400 });
        }
        const clampedDays = Math.max(0, Math.min(365, Math.round(days)));
        const user = await prisma.user.update({
          where: { id: userId },
          data: { totalVacationDays: clampedDays },
          select: { id: true, totalVacationDays: true },
        });
        return NextResponse.json({ success: true, user });
      }

      case "move-department": {
        const { userId, department, managerId } = body;
        if (!userId || !department) {
          return NextResponse.json({ success: false, error: "Ungültige Parameter." }, { status: 400 });
        }
        const user = await prisma.user.update({
          where: { id: userId },
          data: { department, managerId: managerId || null },
          select: { id: true, department: true, managerId: true },
        });
        return NextResponse.json({ success: true, user });
      }

      case "set-password": {
        const { userId, passwordHash } = body;
        if (!userId || !passwordHash) {
          return NextResponse.json({ success: false, error: "Ungültige Parameter." }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash },
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ success: false, error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
