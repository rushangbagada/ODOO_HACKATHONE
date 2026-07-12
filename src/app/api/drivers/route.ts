import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import { validateUniqueDriverLicense } from "@/lib/rules";
import { z } from "zod";

const createDriverSchema = z.object({
  name: z.string().min(1, "Driver name required"),
  licenseNumber: z.string().min(1, "License number required"),
  licenseCategory: z.string().min(1, "License category required"),
  licenseExpiryDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "License expiry date must be in the future",
  }),
  contactNumber: z.string().min(1, "Contact number required"),
  safetyScore: z.number().int().min(0).max(100).default(100),
  region: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "drivers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const region = searchParams.get("region");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (region) where.region = region;

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        trips: true,
      },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Drivers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "drivers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createDriverSchema.parse(body);

    try {
      await validateUniqueDriverLicense(validatedData.licenseNumber);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }

    const driver = await prisma.driver.create({
      data: {
        name: validatedData.name,
        licenseNumber: validatedData.licenseNumber,
        licenseCategory: validatedData.licenseCategory,
        licenseExpiryDate: new Date(validatedData.licenseExpiryDate),
        contactNumber: validatedData.contactNumber,
        safetyScore: validatedData.safetyScore,
        region: validatedData.region,
      },
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Drivers POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
