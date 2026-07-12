import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { canRead } from "@/lib/permissions";
import { getDashboardMetrics, getComplianceAlerts } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canRead(user.role as any, "dashboard")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const region = searchParams.get("region");

    // type/region narrow the vehicle pool behind every vehicle-based KPI card.
    // status is handled separately below since the KPI cards are already status-bucketed.
    const vehicleWhere: Record<string, any> = {};
    if (type) vehicleWhere.type = type;
    if (region) vehicleWhere.region = region;

    // Get KPI metrics
    const metrics = await getDashboardMetrics(vehicleWhere);

    // Get compliance alerts
    const alerts = await getComplianceAlerts();

    // Get trips by status
    const tripsByStatusRaw = await prisma.trip.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const tripsByStatus = tripsByStatusRaw.map((row) => ({
      status: row.status,
      count: row._count.id,
    }));

    // Get fleet composition by type (status filter, if set, narrows composition to that status)
    const fleetCompositionRaw = await prisma.vehicle.groupBy({
      by: ["type"],
      _count: { id: true },
      where: {
        ...vehicleWhere,
        status: status ? (status as any) : { not: "RETIRED" },
      },
    });
    const fleetComposition = fleetCompositionRaw.map((row) => ({
      type: row.type,
      count: row._count.id,
    }));

    // Get utilization trend (last 14 days)
    const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const completedTripsLast14 = await prisma.trip.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: last14Days },
      },
      orderBy: { completedAt: "asc" },
    });

    // Group by day
    const utilizationTrendMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const date = new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      utilizationTrendMap.set(dateStr, 0);
    }

    completedTripsLast14.forEach((trip) => {
      if (trip.completedAt) {
        const dateStr = trip.completedAt.toISOString().split("T")[0];
        const count = utilizationTrendMap.get(dateStr) || 0;
        utilizationTrendMap.set(dateStr, count + 1);
      }
    });

    const utilizationTrend = Array.from(utilizationTrendMap.entries()).map(([date, count]) => ({
      date,
      trips: count,
    }));

    // Distinct filter options, computed from the full (unfiltered) vehicle set.
    const allVehicles = await prisma.vehicle.findMany({
      select: { type: true, region: true },
    });
    const filterOptions = {
      types: Array.from(new Set(allVehicles.map((v) => v.type))).sort(),
      regions: Array.from(new Set(allVehicles.map((v) => v.region).filter(Boolean))).sort() as string[],
    };

    return NextResponse.json({
      metrics,
      alerts,
      tripsByStatus,
      fleetComposition,
      utilizationTrend,
      filterOptions,
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
