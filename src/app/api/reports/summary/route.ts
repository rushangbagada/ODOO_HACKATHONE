import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "reports")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const completedTrips = await prisma.trip.findMany({
      where: { status: "COMPLETED" },
    });

    const totalRevenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

    const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      prisma.fuelLog.findMany(),
      prisma.maintenanceLog.findMany(),
      prisma.expense.findMany(),
    ]);

    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

    return NextResponse.json({
      completedTrips: completedTrips.length,
      totalRevenue,
      totalOperationalCost,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
    });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
