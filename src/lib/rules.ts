import { prisma } from "./prisma";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function validateVehicleAvailable(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new ValidationError("Vehicle not found");
  }

  if (vehicle.status !== "AVAILABLE") {
    throw new ValidationError(
      `Vehicle is ${vehicle.status}. Only AVAILABLE vehicles can be used for trips.`
    );
  }

  return vehicle;
}

export async function validateDriverAvailable(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    throw new ValidationError("Driver not found");
  }

  if (driver.status !== "AVAILABLE") {
    throw new ValidationError(
      `Driver is ${driver.status}. Only AVAILABLE drivers can be assigned to trips.`
    );
  }

  if (driver.licenseExpiryDate < new Date()) {
    throw new ValidationError(
      `Driver's license expired on ${driver.licenseExpiryDate.toLocaleDateString()}.`
    );
  }

  return driver;
}

export async function validateCargoWeight(
  cargoWeight: number,
  vehicleId: string
) {
  const vehicle = await validateVehicleAvailable(vehicleId);

  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new ValidationError(
      `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`
    );
  }

  return vehicle;
}

export async function validateUniqueRegNumber(regNumber: string) {
  const existing = await prisma.vehicle.findUnique({
    where: { regNumber },
  });

  if (existing) {
    throw new ValidationError(
      `Vehicle with registration number ${regNumber} already exists`
    );
  }
}

export async function validateUniqueDriverLicense(licenseNumber: string) {
  const existing = await prisma.driver.findUnique({
    where: { licenseNumber },
  });

  if (existing) {
    throw new ValidationError(
      `Driver with license number ${licenseNumber} already exists`
    );
  }
}

export async function validateNoActiveMaintenanceLog(vehicleId: string) {
  const activeLog = await prisma.maintenanceLog.findFirst({
    where: {
      vehicleId,
      status: "ACTIVE",
    },
  });

  if (activeLog) {
    throw new ValidationError(
      `Vehicle already has an active maintenance log. Please close it first.`
    );
  }
}

export async function validateVehicleNotOnTrip(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (vehicle?.status === "ON_TRIP") {
    throw new ValidationError(
      `Cannot retire vehicle while it is ON_TRIP. Please wait for the trip to complete.`
    );
  }
}

export function getAvailableVehiclesQuery() {
  return {
    where: {
      status: "AVAILABLE",
    },
  };
}

export function getAvailableDriversQuery() {
  return {
    where: {
      status: "AVAILABLE",
      licenseExpiryDate: {
        gt: new Date(),
      },
    },
  };
}

export async function getAvailableVehicles() {
  return prisma.vehicle.findMany(getAvailableVehiclesQuery());
}

export async function getAvailableDrivers() {
  return prisma.driver.findMany(getAvailableDriversQuery());
}
