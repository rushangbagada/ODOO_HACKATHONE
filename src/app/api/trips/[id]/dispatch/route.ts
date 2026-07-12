import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canUpdate } from "@/lib/permissions";
import {
  validateCargoWeight,
  validateVehicleAvailable,
  validateDriverAvailable,
  ValidationError,
} from "@/lib/rules";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canUpdate(user.role as any, "trips")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Can only dispatch DRAFT trips. Current status: ${trip.status}` },
        { status: 400 }
      );
    }

    // Re-validate business rules at dispatch time
    try {
      await validateVehicleAvailable(trip.vehicleId);
      await validateDriverAvailable(trip.driverId);
      await validateCargoWeight(trip.cargoWeight, trip.vehicleId);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Transaction: update trip, vehicle, and driver status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id: params.id },
        data: {
          status: "DISPATCHED",
          dispatchedAt: new Date(),
        },
        include: { vehicle: true, driver: true },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ON_TRIP" },
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "ON_TRIP" },
      });

      return updatedTrip;
    });

    return NextResponse.json({ trip: updated });
  } catch (error) {
    console.error("Dispatch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
