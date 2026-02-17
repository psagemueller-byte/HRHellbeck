import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Das Passwort muss zwischen ${PASSWORD_MIN_LENGTH} und ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`,
        },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.",
        },
        { status: 400 }
      );
    }

    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { success: false, error: "Dein Konto ist deaktiviert." },
        { status: 403 }
      );
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { success: false, error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
