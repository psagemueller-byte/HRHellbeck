import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body = await req.json();
    const allowedFields = [
      "firstName", "lastName", "phone", "street", "city", "zipCode",
      "country", "birthDate", "image", "position", "department",
    ];

    const data: Record<string, string | undefined> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    // Handle avatar field mapping (frontend uses 'avatar', DB uses 'image')
    if (body.avatar !== undefined) {
      data.image = body.avatar || null;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true, email: true, name: true, firstName: true, lastName: true,
        position: true, department: true, phone: true, role: true, isActive: true,
        image: true, street: true, city: true, zipCode: true, country: true,
        birthDate: true, startDate: true, managerId: true, totalVacationDays: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
