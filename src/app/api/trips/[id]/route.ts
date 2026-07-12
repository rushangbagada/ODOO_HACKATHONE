import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canUpdate } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "trips")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        driver: true,
        fuelLogs: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Trip GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
