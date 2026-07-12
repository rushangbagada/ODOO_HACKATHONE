import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import { z } from "zod";

const createDocumentSchema = z.object({
  name: z.string().min(1, "Document name required"),
  url: z.string().url("Must be a valid URL"),
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

    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Vehicle documents GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    if (!canCreate(user.role as any, "vehicles")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createDocumentSchema.parse(body);

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId: id,
        name: validatedData.name,
        url: validatedData.url,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Vehicle documents POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
