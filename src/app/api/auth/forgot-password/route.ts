import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      // Always return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: true });
    }

    // Rate limit: max 3 reset tokens per user per hour
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    });

    if (recentTokens >= 3) {
      return NextResponse.json({ success: true });
    }

    // Invalidate previous unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600_000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    });

    await sendPasswordResetEmail(user.email, token, user.firstName || "Nutzer");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    // Never leak errors
    return NextResponse.json({ success: true });
  }
}
