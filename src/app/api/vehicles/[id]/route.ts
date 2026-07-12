import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canUpdate } from "@/lib/permissions";
import { validateVehicleNotOnTrip, ValidationError } from "@/lib/rules";
import { z } from "zod";

const updateVehicleSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  maxLoadCapacity: z.number().positive().optional(),
  acquisitionCost: z.number().positive().optional(),
  odometer: z.number().nonnegative().optional(),
  region: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "vehicles")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          include: { driver: true },
          orderBy: { createdAt: "desc" },
        },
        maintenanceLogs: {
          orderBy: { startDate: "desc" },
        },
        fuelLogs: {
          orderBy: { date: "desc" },
        },
        expenses: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("Vehicle GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canUpdate(user.role as any, "vehicles")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Validate retirement
    if (validatedData.status === "RETIRED") {
      try {
        await validateVehicleNotOnTrip(id);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Vehicle PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
