import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// One-time admin seed endpoint
// POST /api/seed-admin with { secret: "hellbeck-seed-2024" }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Simple secret to prevent unauthorized use
    if (body.secret !== "hellbeck-seed-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = "p.sagemueller@googlemail.com";

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "User already exists", userId: existing.id });
    }

    const passwordHash = await bcrypt.hash("test123!", 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: "Patrick Sagemüller",
        passwordHash,
        firstName: "Patrick",
        lastName: "Sagemüller",
        position: "HR-Administrator",
        department: "HR",
        role: "admin",
        city: "Borchen",
        country: "Deutschland",
        birthDate: "1985-01-01",
        startDate: "2019-01-01",
        isActive: true,
        totalVacationDays: 30,
      },
    });

    return NextResponse.json({ message: "Admin user created", userId: user.id });
  } catch (error) {
    console.error("[seed-admin] Error:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: String(error) },
      { status: 500 }
    );
  }
}
