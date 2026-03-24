import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        phone: true,
        role: true,
        isActive: true,
        image: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        birthDate: true,
        startDate: true,
        managerId: true,
        totalVacationDays: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
