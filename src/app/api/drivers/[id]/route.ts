import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canUpdate } from "@/lib/permissions";
import { z } from "zod";

const updateDriverSchema = z.object({
  name: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseCategory: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  contactNumber: z.string().optional(),
  safetyScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
  region: z.string().optional(),
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

    if (!canRead(user.role as any, "drivers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: {
          include: { vehicle: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("Driver GET error:", error);
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

    const body = await request.json();

    // Safety Officer can only update status and safetyScore
    if (user.role === "SAFETY_OFFICER") {
      if (Object.keys(body).some((key) => !["status", "safetyScore"].includes(key))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!canUpdate(user.role as any, "drivers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validatedData = updateDriverSchema.parse(body);

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.licenseExpiryDate) {
      updateData.licenseExpiryDate = new Date(validatedData.licenseExpiryDate);
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: {
        ...validatedData,
        ...updateData,
      },
    });

    return NextResponse.json({ driver: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Driver PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
