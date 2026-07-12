import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can(user.role as any, "maintenance.close")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!log) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    if (log.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Can only close ACTIVE maintenance logs. Current status: ${log.status}` },
        { status: 400 }
      );
    }

    // Transaction: close maintenance log and restore vehicle status if not RETIRED
    const updated = await prisma.$transaction(async (tx) => {
      const closedLog = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: "CLOSED",
          endDate: new Date(),
        },
        include: { vehicle: true },
      });

      // Restore vehicle to AVAILABLE only if it's not RETIRED
      if (log.vehicle.status !== "RETIRED") {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: "AVAILABLE" },
        });
      }

      return closedLog;
    });

    return NextResponse.json({ log: updated });
  } catch (error) {
    console.error("Close maintenance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
