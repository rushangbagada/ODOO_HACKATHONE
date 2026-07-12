import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canCreate } from "@/lib/permissions";
import { z } from "zod";

const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  type: z.enum(["TOLL", "MAINTENANCE", "OTHER"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "expenses")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get("vehicleId");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { [sort]: order },
      include: { vehicle: true },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreate(user.role as any, "expenses")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        vehicleId: validatedData.vehicleId,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
      },
      include: { vehicle: true },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
