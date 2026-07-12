import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canUpdate } from "@/lib/permissions";
import { z } from "zod";

const completeTripSchema = z.object({
  endOdometer: z.number().positive("End odometer must be positive"),
  fuelConsumed: z.number().positive("Fuel consumed must be positive"),
  revenue: z.number().default(0),
  fuelCost: z.number().positive("Fuel cost must be positive"),
});

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
      include: { vehicle: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.status !== "DISPATCHED") {
      return NextResponse.json(
        { error: `Can only complete DISPATCHED trips. Current status: ${trip.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = completeTripSchema.parse(body);

    // Transaction: update trip, vehicle, driver, and create fuel log
    const updated = await prisma.$transaction(async (tx) => {
      const actualDistance = validatedData.endOdometer - (trip.startOdometer || trip.vehicle.odometer);

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          endOdometer: validatedData.endOdometer,
          fuelConsumed: validatedData.fuelConsumed,
          actualDistance,
          revenue: validatedData.revenue,
        },
        include: { vehicle: true, driver: true },
      });

      // Update vehicle
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: "AVAILABLE",
          odometer: validatedData.endOdometer,
        },
      });

      // Update driver
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });

      // Create fuel log
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: id,
          liters: validatedData.fuelConsumed,
          cost: validatedData.fuelCost,
          date: new Date(),
        },
      });

      return updatedTrip;
    });

    return NextResponse.json({ trip: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Complete trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
