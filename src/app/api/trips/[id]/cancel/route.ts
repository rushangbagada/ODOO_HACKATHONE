import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canUpdate } from "@/lib/permissions";

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

    if (!canUpdate(user.role as any, "trips")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (!["DRAFT", "DISPATCHED"].includes(trip.status)) {
      return NextResponse.json(
        { error: `Can only cancel DRAFT or DISPATCHED trips. Current status: ${trip.status}` },
        { status: 400 }
      );
    }

    // Transaction: update trip, vehicle, and driver status if dispatched
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
        include: { vehicle: true, driver: true },
      });

      // If was DISPATCHED, restore vehicle and driver to AVAILABLE
      if (trip.status === "DISPATCHED") {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: "AVAILABLE" },
        });
      }

      return updatedTrip;
    });

    return NextResponse.json({ trip: updated });
  } catch (error) {
    console.error("Cancel trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
