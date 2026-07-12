import { describe, it, expect, vi, beforeEach } from "vitest";

// rules.ts talks to the real Neon Postgres DB via `prisma` — mock it so these
// tests exercise business-rule logic only, never touch the network or real data.
vi.mock("./prisma", () => ({
  prisma: {
    vehicle: { findUnique: vi.fn(), findMany: vi.fn() },
    driver: { findUnique: vi.fn(), findMany: vi.fn() },
    maintenanceLog: { findFirst: vi.fn() },
  },
}));

import { prisma } from "./prisma";
import {
  validateVehicleAvailable,
  validateDriverAvailable,
  validateCargoWeight,
  validateUniqueRegNumber,
  validateUniqueDriverLicense,
  validateNoActiveMaintenanceLog,
  validateVehicleNotOnTrip,
  getAvailableVehiclesQuery,
  getAvailableDriversQuery,
  ValidationError,
} from "./rules";

const mockPrisma = prisma as unknown as {
  vehicle: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  driver: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  maintenanceLog: { findFirst: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

function makeVehicle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "veh-1",
    regNumber: "VAN-05",
    status: "AVAILABLE",
    maxLoadCapacity: 500,
    ...overrides,
  };
}

function makeDriver(overrides: Partial<Record<string, unknown>> = {}) {
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  return {
    id: "drv-1",
    licenseNumber: "LIC-001",
    status: "AVAILABLE",
    licenseExpiryDate: farFuture,
    ...overrides,
  };
}

describe("validateVehicleAvailable", () => {
  it("throws if the vehicle does not exist", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null);
    await expect(validateVehicleAvailable("missing")).rejects.toThrow(ValidationError);
    await expect(validateVehicleAvailable("missing")).rejects.toThrow(/not found/i);
  });

  it("throws if the vehicle is not AVAILABLE (ON_TRIP)", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "ON_TRIP" }));
    await expect(validateVehicleAvailable("veh-1")).rejects.toThrow(/ON_TRIP/);
  });

  it("throws if the vehicle is IN_SHOP", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "IN_SHOP" }));
    await expect(validateVehicleAvailable("veh-1")).rejects.toThrow(/IN_SHOP/);
  });

  it("throws if the vehicle is RETIRED", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "RETIRED" }));
    await expect(validateVehicleAvailable("veh-1")).rejects.toThrow(/RETIRED/);
  });

  it("returns the vehicle when it is AVAILABLE", async () => {
    const vehicle = makeVehicle();
    mockPrisma.vehicle.findUnique.mockResolvedValue(vehicle);
    await expect(validateVehicleAvailable("veh-1")).resolves.toEqual(vehicle);
  });
});

describe("validateDriverAvailable", () => {
  it("throws if the driver does not exist", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue(null);
    await expect(validateDriverAvailable("missing")).rejects.toThrow(/not found/i);
  });

  it("throws if the driver is SUSPENDED", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue(makeDriver({ status: "SUSPENDED" }));
    await expect(validateDriverAvailable("drv-1")).rejects.toThrow(/SUSPENDED/);
  });

  it("throws if the driver's license has expired, even if status is AVAILABLE", async () => {
    const expired = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockPrisma.driver.findUnique.mockResolvedValue(makeDriver({ licenseExpiryDate: expired }));
    await expect(validateDriverAvailable("drv-1")).rejects.toThrow(/license expired/i);
  });

  it("returns the driver when AVAILABLE with a valid license", async () => {
    const driver = makeDriver();
    mockPrisma.driver.findUnique.mockResolvedValue(driver);
    await expect(validateDriverAvailable("drv-1")).resolves.toEqual(driver);
  });
});

describe("validateCargoWeight", () => {
  it("throws when cargo exceeds the vehicle's max load capacity", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ maxLoadCapacity: 500 }));
    await expect(validateCargoWeight(600, "veh-1")).rejects.toThrow(/exceeds vehicle capacity/i);
  });

  it("allows cargo exactly at the max load capacity", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ maxLoadCapacity: 500 }));
    await expect(validateCargoWeight(500, "veh-1")).resolves.toBeDefined();
  });

  it("allows cargo under the max load capacity", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ maxLoadCapacity: 500 }));
    await expect(validateCargoWeight(450, "veh-1")).resolves.toBeDefined();
  });

  it("still enforces vehicle availability before checking cargo weight", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "IN_SHOP" }));
    await expect(validateCargoWeight(100, "veh-1")).rejects.toThrow(/IN_SHOP/);
  });
});

describe("validateUniqueRegNumber", () => {
  it("throws if a vehicle with that reg number already exists", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ regNumber: "VAN-05" }));
    await expect(validateUniqueRegNumber("VAN-05")).rejects.toThrow(/already exists/i);
  });

  it("resolves silently when the reg number is free", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null);
    await expect(validateUniqueRegNumber("VAN-99")).resolves.toBeUndefined();
  });
});

describe("validateUniqueDriverLicense", () => {
  it("throws if a driver with that license number already exists", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue(makeDriver({ licenseNumber: "LIC-001" }));
    await expect(validateUniqueDriverLicense("LIC-001")).rejects.toThrow(/already exists/i);
  });

  it("resolves silently when the license number is free", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue(null);
    await expect(validateUniqueDriverLicense("LIC-999")).resolves.toBeUndefined();
  });
});

describe("validateNoActiveMaintenanceLog", () => {
  it("throws if the vehicle already has an ACTIVE maintenance log", async () => {
    mockPrisma.maintenanceLog.findFirst.mockResolvedValue({ id: "log-1", status: "ACTIVE" });
    await expect(validateNoActiveMaintenanceLog("veh-1")).rejects.toThrow(/active maintenance log/i);
  });

  it("resolves silently when there is no active maintenance log", async () => {
    mockPrisma.maintenanceLog.findFirst.mockResolvedValue(null);
    await expect(validateNoActiveMaintenanceLog("veh-1")).resolves.toBeUndefined();
  });
});

describe("validateVehicleNotOnTrip", () => {
  it("throws if the vehicle is ON_TRIP", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "ON_TRIP" }));
    await expect(validateVehicleNotOnTrip("veh-1")).rejects.toThrow(/ON_TRIP/);
  });

  it("resolves silently for any other status", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: "AVAILABLE" }));
    await expect(validateVehicleNotOnTrip("veh-1")).resolves.toBeUndefined();
  });
});

describe("availability query builders", () => {
  it("getAvailableVehiclesQuery filters to AVAILABLE only", () => {
    expect(getAvailableVehiclesQuery()).toEqual({ where: { status: "AVAILABLE" } });
  });

  it("getAvailableDriversQuery filters to AVAILABLE drivers with a non-expired license", () => {
    const query = getAvailableDriversQuery();
    expect(query.where.status).toBe("AVAILABLE");
    expect(query.where.licenseExpiryDate.gt).toBeInstanceOf(Date);
  });
});
