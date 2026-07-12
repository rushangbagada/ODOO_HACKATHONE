import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import { z } from "zod";

const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  tripId: z.string().optional(),
  liters: z.number().positive("Liters must be positive"),
  cost: z.number().positive("Cost must be positive"),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "fuel")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get("vehicleId");
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { [sort]: order },
      include: { vehicle: true, trip: true },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Fuel logs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "fuel")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createFuelLogSchema.parse(body);

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: validatedData.vehicleId,
        tripId: validatedData.tripId,
        liters: validatedData.liters,
        cost: validatedData.cost,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
      },
      include: { vehicle: true, trip: true },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Fuel logs POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
