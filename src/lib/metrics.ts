import { prisma } from "./prisma";

export async function calculateFleetUtilization(vehicleWhere: Record<string, any> = {}) {
  const [onTripVehicles, totalNonRetired] = await Promise.all([
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: { not: "RETIRED" } } }),
  ]);

  if (totalNonRetired === 0) return 0;
  return Math.round((onTripVehicles / totalNonRetired) * 100);
}

export async function calculateFuelEfficiency(vehicleId: string) {
  const [trips, fuelLogs] = await Promise.all([
    prisma.trip.findMany({
      where: { vehicleId, status: "COMPLETED" },
    }),
    prisma.fuelLog.findMany({
      where: { vehicleId },
    }),
  ]);

  const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistance || t.plannedDistance || 0), 0);
  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.liters, 0);

  if (totalFuel === 0 || totalDistance === 0) return null;
  return Math.round((totalDistance / totalFuel) * 100) / 100;
}

export async function calculateOperationalCost(vehicleId: string) {
  const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
    prisma.fuelLog.findMany({ where: { vehicleId } }),
    prisma.maintenanceLog.findMany({ where: { vehicleId } }),
    prisma.expense.findMany({ where: { vehicleId } }),
  ]);

  const fuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const maintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const expenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);

  return fuelCost + maintenanceCost + expenseCost;
}

export async function calculateVehicleROI(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      trips: true,
      maintenanceLogs: true,
      fuelLogs: true,
      expenses: true,
    },
  });

  if (!vehicle) return null;

  const totalRevenue = vehicle.trips
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.revenue, 0);

  const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const fuelCost = vehicle.fuelLogs.reduce((sum, f) => sum + f.cost, 0);

  // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost, per spec.
  const profit = totalRevenue - (maintenanceCost + fuelCost);

  if (vehicle.acquisitionCost === 0) return null;
  return Math.round((profit / vehicle.acquisitionCost) * 10000) / 10000;
}

export async function getPerVehicleReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: true,
      maintenanceLogs: true,
      fuelLogs: true,
      expenses: true,
    },
    orderBy: { regNumber: "asc" },
  });

  return vehicles.map((vehicle) => {
    const completedTrips = vehicle.trips.filter((t) => t.status === "COMPLETED");
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.actualDistance || t.plannedDistance || 0), 0);
    const totalFuelLiters = vehicle.fuelLogs.reduce((sum, f) => sum + f.liters, 0);
    const fuelCost = vehicle.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
    const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
    const expenseCost = vehicle.expenses.reduce((sum, e) => sum + e.amount, 0);
    const revenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

    const fuelEfficiency =
      totalFuelLiters > 0 && totalDistance > 0 ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 : null;
    const operationalCost = fuelCost + maintenanceCost + expenseCost;
    const roi =
      vehicle.acquisitionCost > 0
        ? Math.round(((revenue - (maintenanceCost + fuelCost)) / vehicle.acquisitionCost) * 10000) / 10000
        : null;

    return {
      vehicleId: vehicle.id,
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      acquisitionCost: vehicle.acquisitionCost,
      completedTrips: completedTrips.length,
      totalDistance,
      totalFuelLiters,
      fuelEfficiency,
      fuelCost,
      maintenanceCost,
      expenseCost,
      operationalCost,
      revenue,
      roi,
    };
  });
}

export async function getDashboardMetrics(vehicleWhere: Record<string, any> = {}) {
  const [
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { ...vehicleWhere, status: { not: "RETIRED" } } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "IN_SHOP" } }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.driver.count({ where: { status: "ON_TRIP" } }),
  ]);

  const fleetUtilization = await calculateFleetUtilization(vehicleWhere);

  return {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
  };
}

export async function getComplianceAlerts() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expiringSoon, expiredLicenses, activeMaintenanceLogs] = await Promise.all([
    prisma.driver.findMany({
      where: {
        licenseExpiryDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
    }),
    prisma.driver.findMany({
      where: {
        licenseExpiryDate: { lt: today },
      },
    }),
    prisma.maintenanceLog.findMany({
      where: { status: "ACTIVE" },
      include: { vehicle: true },
    }),
  ]);

  return {
    expiringSoon,
    expiredLicenses,
    activeMaintenanceLogs,
  };
}
