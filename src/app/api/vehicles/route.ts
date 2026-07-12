import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import {
  validateUniqueRegNumber,
  ValidationError,
} from "@/lib/rules";
import { z } from "zod";

const createVehicleSchema = z.object({
  regNumber: z.string().min(1, "Registration number required"),
  name: z.string().min(1, "Vehicle name required"),
  type: z.string().min(1, "Vehicle type required"),
  maxLoadCapacity: z.number().positive("Max load capacity must be positive"),
  acquisitionCost: z.number().positive("Acquisition cost must be positive"),
  odometer: z.number().nonnegative().default(0),
  region: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "vehicles")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const region = searchParams.get("region");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (search) {
      where.OR = [
        { regNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (region) where.region = region;

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        trips: true,
        maintenanceLogs: true,
        fuelLogs: true,
      },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Vehicles GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "vehicles")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createVehicleSchema.parse(body);

    try {
      await validateUniqueRegNumber(validatedData.regNumber);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        regNumber: validatedData.regNumber,
        name: validatedData.name,
        type: validatedData.type,
        maxLoadCapacity: validatedData.maxLoadCapacity,
        acquisitionCost: validatedData.acquisitionCost,
        odometer: validatedData.odometer,
        region: validatedData.region,
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Vehicles POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
