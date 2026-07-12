import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPerVehicleReport, calculateFleetUtilization } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "reports")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Role-based data fetching
    if (user.role === "SAFETY_OFFICER") {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [expiringSoon, expiredLicenses, drivers] = await Promise.all([
        prisma.driver.findMany({
          where: {
            licenseExpiryDate: {
              gte: today,
              lte: thirtyDaysFromNow,
            },
          },
          orderBy: { licenseExpiryDate: "asc" },
        }),
        prisma.driver.findMany({
          where: {
            licenseExpiryDate: { lt: today },
          },
          orderBy: { licenseExpiryDate: "asc" },
        }),
        prisma.driver.findMany({
          orderBy: { safetyScore: "desc" },
        }),
      ]);

      return NextResponse.json({
        role: "SAFETY_OFFICER",
        expiredCount: expiredLicenses.length,
        expiringSoonCount: expiringSoon.length,
        expiredLicenses,
        expiringSoon,
        drivers: drivers.map(d => ({
          id: d.id,
          name: d.name,
          licenseNumber: d.licenseNumber,
          safetyScore: d.safetyScore,
          status: d.status,
          licenseExpiryDate: d.licenseExpiryDate,
        })),
      });
    }

    // Default for FLEET_MANAGER, DRIVER, and FINANCIAL_ANALYST: Full aggregate metrics
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

    const perVehicle = await getPerVehicleReport();
    const fleetUtilization = await calculateFleetUtilization();

    return NextResponse.json({
      role: user.role,
      completedTrips: completedTrips.length,
      totalRevenue,
      totalOperationalCost,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      fleetUtilization,
      perVehicle,
    });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
