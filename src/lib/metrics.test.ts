import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./prisma", () => ({
  prisma: {
    vehicle: { count: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    trip: { findMany: vi.fn(), count: vi.fn() },
    fuelLog: { findMany: vi.fn() },
    maintenanceLog: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    driver: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "./prisma";
import {
  calculateFleetUtilization,
  calculateFuelEfficiency,
  calculateOperationalCost,
  calculateVehicleROI,
  getPerVehicleReport,
} from "./metrics";

const mockPrisma = prisma as unknown as {
  vehicle: { count: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  trip: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  fuelLog: { findMany: ReturnType<typeof vi.fn> };
  maintenanceLog: { findMany: ReturnType<typeof vi.fn> };
  expense: { findMany: ReturnType<typeof vi.fn> };
  driver: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("calculateFleetUtilization", () => {
  it("returns 0 when there are no non-retired vehicles (avoids divide-by-zero)", async () => {
    mockPrisma.vehicle.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    await expect(calculateFleetUtilization()).resolves.toBe(0);
  });

  it("computes the percentage of ON_TRIP vehicles among non-retired vehicles", async () => {
    // 3 on trip, 10 total non-retired -> 30%
    mockPrisma.vehicle.count.mockResolvedValueOnce(3).mockResolvedValueOnce(10);
    await expect(calculateFleetUtilization()).resolves.toBe(30);
  });

  it("rounds to the nearest whole percent", async () => {
    // 1 of 3 -> 33.33% -> rounds to 33
    mockPrisma.vehicle.count.mockResolvedValueOnce(1).mockResolvedValueOnce(3);
    await expect(calculateFleetUtilization()).resolves.toBe(33);
  });
});

describe("calculateFuelEfficiency (Distance / Fuel, per spec §3.8)", () => {
  it("returns null when there are no fuel logs", async () => {
    mockPrisma.trip.findMany.mockResolvedValue([{ actualDistance: 100, plannedDistance: 90, status: "COMPLETED" }]);
    mockPrisma.fuelLog.findMany.mockResolvedValue([]);
    await expect(calculateFuelEfficiency("veh-1")).resolves.toBeNull();
  });

  it("returns null when there is no completed distance", async () => {
    mockPrisma.trip.findMany.mockResolvedValue([]);
    mockPrisma.fuelLog.findMany.mockResolvedValue([{ liters: 10 }]);
    await expect(calculateFuelEfficiency("veh-1")).resolves.toBeNull();
  });

  it("uses actualDistance when available, falls back to plannedDistance otherwise", async () => {
    mockPrisma.trip.findMany.mockResolvedValue([
      { actualDistance: 150, plannedDistance: 140 }, // uses 150
      { actualDistance: null, plannedDistance: 50 }, // falls back to 50
    ]);
    mockPrisma.fuelLog.findMany.mockResolvedValue([{ liters: 20 }]);
    // total distance = 200, total fuel = 20 -> 10 km/L
    await expect(calculateFuelEfficiency("veh-1")).resolves.toBe(10);
  });
});

describe("calculateOperationalCost (Fuel + Maintenance + Other, per spec §3.7)", () => {
  it("sums fuel, maintenance, and expense costs for the vehicle", async () => {
    mockPrisma.fuelLog.findMany.mockResolvedValue([{ cost: 1000 }, { cost: 500 }]);
    mockPrisma.maintenanceLog.findMany.mockResolvedValue([{ cost: 2000 }]);
    mockPrisma.expense.findMany.mockResolvedValue([{ amount: 300 }]);
    await expect(calculateOperationalCost("veh-1")).resolves.toBe(3800);
  });

  it("returns 0 when there are no cost records at all", async () => {
    mockPrisma.fuelLog.findMany.mockResolvedValue([]);
    mockPrisma.maintenanceLog.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);
    await expect(calculateOperationalCost("veh-1")).resolves.toBe(0);
  });
});

describe("calculateVehicleROI ((Revenue - (Maintenance + Fuel)) / Acquisition Cost, per spec §3.8)", () => {
  it("returns null when the vehicle does not exist", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null);
    await expect(calculateVehicleROI("missing")).resolves.toBeNull();
  });

  it("returns null when acquisition cost is 0 (avoids divide-by-zero)", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      acquisitionCost: 0,
      trips: [],
      maintenanceLogs: [],
      fuelLogs: [],
    });
    await expect(calculateVehicleROI("veh-1")).resolves.toBeNull();
  });

  it("only counts revenue from COMPLETED trips", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      acquisitionCost: 10000,
      trips: [
        { status: "COMPLETED", revenue: 5000 },
        { status: "DISPATCHED", revenue: 9999 }, // must be ignored — not realized revenue
        { status: "CANCELLED", revenue: 9999 },
      ],
      maintenanceLogs: [{ cost: 1000 }],
      fuelLogs: [{ cost: 500 }],
    });
    // (5000 - (1000 + 500)) / 10000 = 0.35
    await expect(calculateVehicleROI("veh-1")).resolves.toBe(0.35);
  });

  it("can return a negative ROI when costs exceed revenue", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      acquisitionCost: 1000,
      trips: [{ status: "COMPLETED", revenue: 100 }],
      maintenanceLogs: [{ cost: 500 }],
      fuelLogs: [{ cost: 500 }],
    });
    // (100 - 1000) / 1000 = -0.9
    await expect(calculateVehicleROI("veh-1")).resolves.toBe(-0.9);
  });
});

describe("getPerVehicleReport", () => {
  it("shapes each vehicle's aggregate financial/operational data correctly", async () => {
    mockPrisma.vehicle.findMany.mockResolvedValue([
      {
        id: "veh-1",
        regNumber: "VAN-05",
        name: "Van-05",
        type: "Van",
        status: "AVAILABLE",
        acquisitionCost: 25000,
        trips: [
          { status: "COMPLETED", actualDistance: 150, plannedDistance: 140, revenue: 2000 },
          { status: "DRAFT", actualDistance: null, plannedDistance: 300, revenue: 0 },
        ],
        maintenanceLogs: [{ cost: 3000 }],
        fuelLogs: [{ liters: 15, cost: 1350 }],
        expenses: [{ amount: 500 }],
      },
    ]);

    const report = await getPerVehicleReport();
    expect(report).toHaveLength(1);
    expect(report[0]).toMatchObject({
      vehicleId: "veh-1",
      regNumber: "VAN-05",
      completedTrips: 1,
      totalDistance: 150,
      totalFuelLiters: 15,
      fuelCost: 1350,
      maintenanceCost: 3000,
      expenseCost: 500,
      operationalCost: 4850,
      revenue: 2000,
      fuelEfficiency: 10,
    });
    // ROI = (2000 - (3000 + 1350)) / 25000 = -0.094
    expect(report[0].roi).toBeCloseTo(-0.094, 4);
  });
});
