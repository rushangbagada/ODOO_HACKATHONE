import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import {
  validateCargoWeight,
  validateVehicleAvailable,
  validateDriverAvailable,
  ValidationError,
} from "@/lib/rules";
import { z } from "zod";

const createTripSchema = z.object({
  source: z.string().min(1, "Source required"),
  destination: z.string().min(1, "Destination required"),
  vehicleId: z.string().min(1, "Vehicle required"),
  driverId: z.string().min(1, "Driver required"),
  cargoWeight: z.number().positive("Cargo weight must be positive"),
  plannedDistance: z.number().positive("Planned distance must be positive"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "trips")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (status) where.status = status;

    if (user.role === "DRIVER") {
      const driverRecord =
        (await prisma.driver.findFirst({
          where: { name: { equals: user.name, mode: "insensitive" } },
        })) || (await prisma.driver.findFirst());
      where.driverId = driverRecord?.id ?? "__none__";
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        vehicle: true,
        driver: true,
        fuelLogs: true,
      },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error("Trips GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "trips")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTripSchema.parse(body);

    // Validate vehicle and driver availability
    try {
      await validateVehicleAvailable(validatedData.vehicleId);
      await validateDriverAvailable(validatedData.driverId);
      await validateCargoWeight(validatedData.cargoWeight, validatedData.vehicleId);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        source: validatedData.source,
        destination: validatedData.destination,
        vehicleId: validatedData.vehicleId,
        driverId: validatedData.driverId,
        cargoWeight: validatedData.cargoWeight,
        plannedDistance: validatedData.plannedDistance,
        status: "DRAFT",
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Trips POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
