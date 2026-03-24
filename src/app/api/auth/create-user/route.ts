import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Authenticate and check admin role
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, position, department, phone, role, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !position || !department || !password) {
      return NextResponse.json(
        { success: false, error: "Alle Pflichtfelder müssen ausgefüllt sein." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Das Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "autor", "benutzer"];
    const userRole = validRoles.includes(role) ? role : "benutzer";

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Ein Nutzer mit dieser E-Mail-Adresse existiert bereits." },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: `${firstName} ${lastName}`.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim(),
        department: department.trim(),
        phone: phone?.trim() || "",
        role: userRole,
        isActive: true,
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
