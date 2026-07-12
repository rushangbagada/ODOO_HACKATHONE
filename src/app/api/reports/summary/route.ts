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
    if (user.role === "DRIVER") {
      let driverRecord = await prisma.driver.findFirst({
        where: { name: { equals: user.name, mode: "insensitive" } }
      });
      
      // Fallback for demo: use the first driver if logged in as default "Driver"
      if (!driverRecord) {
        driverRecord = await prisma.driver.findFirst();
      }

      if (!driverRecord) {
        return NextResponse.json({
          role: "DRIVER",
          completedTrips: 0,
          totalDistance: 0,
          totalFuelLiters: 0,
          totalFuelCost: 0,
          fuelEfficiency: null,
          trips: [],
        });
      }

      const completedTrips = await prisma.trip.findMany({
        where: {
          driverId: driverRecord.id,
          status: "COMPLETED",
        },
        include: { vehicle: true, fuelLogs: true },
        orderBy: { completedAt: "desc" },
      });

      const totalDistance = completedTrips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
      const totalFuelLiters = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
      const totalFuelCost = completedTrips.flatMap(t => t.fuelLogs).reduce((sum, f) => sum + f.cost, 0);
      const fuelEfficiency = totalFuelLiters > 0 ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 : null;

      return NextResponse.json({
        role: "DRIVER",
        driverName: driverRecord.name,
        completedTrips: completedTrips.length,
        totalDistance,
        totalFuelLiters,
        totalFuelCost,
        fuelEfficiency,
        trips: completedTrips.map(t => ({
          id: t.id,
          source: t.source,
          destination: t.destination,
          vehicleName: t.vehicle.name,
          vehicleReg: t.vehicle.regNumber,
          distance: t.actualDistance || t.plannedDistance,
          fuelConsumed: t.fuelConsumed,
          completedAt: t.completedAt,
        })),
      });
    }

    if (user.role === "SAFETY_OFFICER") {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [expiringSoon, expiredLicenses, activeMaintenanceLogs, drivers] = await Promise.all([
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
        prisma.maintenanceLog.findMany({
          where: { status: "ACTIVE" },
          include: { vehicle: true },
        }),
        prisma.driver.findMany({
          orderBy: { safetyScore: "desc" },
        }),
      ]);

      return NextResponse.json({
        role: "SAFETY_OFFICER",
        expiredCount: expiredLicenses.length,
        expiringSoonCount: expiringSoon.length,
        activeMaintenanceCount: activeMaintenanceLogs.length,
        expiredLicenses,
        expiringSoon,
        activeMaintenanceLogs,
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

    // Default for FLEET_MANAGER and FINANCIAL_ANALYST: Full aggregate metrics
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
