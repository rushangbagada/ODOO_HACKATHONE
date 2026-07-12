import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import { validateNoActiveMaintenanceLog, ValidationError } from "@/lib/rules";
import { z } from "zod";

const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  type: z.string().min(1, "Maintenance type required"),
  description: z.string().optional(),
  cost: z.number().default(0),
  startDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "maintenance")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "startDate";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (status) where.status = status;

    const logs = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { [sort]: order },
      include: { vehicle: true },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Maintenance GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "maintenance")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // Check for active maintenance log
    try {
      await validateNoActiveMaintenanceLog(validatedData.vehicleId);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Transaction: create maintenance log and update vehicle status
    const log = await prisma.$transaction(async (tx) => {
      const createdLog = await tx.maintenanceLog.create({
        data: {
          vehicleId: validatedData.vehicleId,
          type: validatedData.type,
          description: validatedData.description,
          cost: validatedData.cost,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
          status: "ACTIVE",
        },
        include: { vehicle: true },
      });

      // Update vehicle status to IN_SHOP
      await tx.vehicle.update({
        where: { id: validatedData.vehicleId },
        data: { status: "IN_SHOP" },
      });

      return createdLog;
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Maintenance POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
