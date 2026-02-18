import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

const INVITATION_EXPIRY_DAYS = 7;

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
    const { firstName, lastName, email, position, department, phone, role } =
      body;

    // Validate required fields
    if (!firstName || !lastName || !email || !position || !department) {
      return NextResponse.json(
        {
          success: false,
          error: "Vorname, Nachname, E-Mail, Position und Abteilung sind Pflichtfelder.",
        },
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
        {
          success: false,
          error: "Ein Nutzer mit dieser E-Mail-Adresse existiert bereits.",
        },
        { status: 409 }
      );
    }

    // Create user without password (can't log in until they set one)
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
      },
    });

    // Generate invitation token (7 days validity)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + INVITATION_EXPIRY_DAYS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: newUser.id,
        expires,
      },
    });

    // Send invitation email
    await sendInvitationEmail(email.toLowerCase().trim(), token, firstName.trim());

    return NextResponse.json({
      success: true,
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Invitation error:", error);
    const message =
      error instanceof Error && error.message.includes("RESEND_API_KEY")
        ? "E-Mail-Versand fehlgeschlagen: RESEND_API_KEY ist nicht konfiguriert."
        : "Ein Fehler ist aufgetreten. Bitte prüfe die Server-Logs.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
