const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const testPassword = "password123";

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Create users - all approved for testing
  const fleetManager = await prisma.user.create({
    data: {
      email: "fleet@transitops.com",
      name: "Fleet Manager",
      password: hashedPassword,
      role: "FLEET_MANAGER",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const driver = await prisma.user.create({
    data: {
      email: "driver@transitops.com",
      name: "Driver",
      password: hashedPassword,
      role: "DRIVER",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const safetyOfficer = await prisma.user.create({
    data: {
      email: "safety@transitops.com",
      name: "Safety Officer",
      password: hashedPassword,
      role: "SAFETY_OFFICER",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const financialAnalyst = await prisma.user.create({
    data: {
      email: "finance@transitops.com",
      name: "Financial Analyst",
      password: hashedPassword,
      role: "FINANCIAL_ANALYST",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  console.log("✓ Created 4 users");

  // Create vehicles
  const van05 = await prisma.vehicle.create({
    data: {
      regNumber: "VAN-05",
      name: "Van-05",
      type: "Van",
      maxLoadCapacity: 500,
      acquisitionCost: 25000,
      odometer: 5000,
      status: "AVAILABLE",
      region: "North",
    },
  });

  const vehicles = [
    van05,
    await prisma.vehicle.create({
      data: {
        regNumber: "TRUCK-01",
        name: "Truck-01",
        type: "Truck",
        maxLoadCapacity: 1000,
        acquisitionCost: 45000,
        odometer: 15000,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "VAN-03",
        name: "Van-03",
        type: "Van",
        maxLoadCapacity: 400,
        acquisitionCost: 22000,
        odometer: 8000,
        status: "AVAILABLE",
        region: "South",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "BIKE-02",
        name: "Bike-02",
        type: "Bike",
        maxLoadCapacity: 100,
        acquisitionCost: 8000,
        odometer: 3000,
        status: "AVAILABLE",
        region: "East",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "TRUCK-02",
        name: "Truck-02",
        type: "Truck",
        maxLoadCapacity: 1200,
        acquisitionCost: 50000,
        odometer: 20000,
        status: "ON_TRIP",
        region: "West",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "TRAILER-01",
        name: "Trailer-01",
        type: "Trailer",
        maxLoadCapacity: 2000,
        acquisitionCost: 15000,
        odometer: 25000,
        status: "ON_TRIP",
        region: "North",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "VAN-04",
        name: "Van-04",
        type: "Van",
        maxLoadCapacity: 450,
        acquisitionCost: 23000,
        odometer: 7000,
        status: "IN_SHOP",
        region: "Central",
      },
    }),
    await prisma.vehicle.create({
      data: {
        regNumber: "TRUCK-03",
        name: "Truck-03",
        type: "Truck",
        maxLoadCapacity: 800,
        acquisitionCost: 40000,
        odometer: 30000,
        status: "RETIRED",
        region: "South",
      },
    }),
  ];

  console.log("✓ Created 8 vehicles");

  // Create drivers
  const alex = await prisma.driver.create({
    data: {
      name: "Alex",
      licenseNumber: "LIC-001",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2026-12-31"),
      contactNumber: "+91-9876543210",
      safetyScore: 95,
      status: "AVAILABLE",
      region: "North",
    },
  });

  const drivers = [
    alex,
    await prisma.driver.create({
      data: {
        name: "John Smith",
        licenseNumber: "LIC-002",
        licenseCategory: "LMV",
        licenseExpiryDate: new Date("2027-06-30"),
        contactNumber: "+91-9876543211",
        safetyScore: 90,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "Sarah Johnson",
        licenseNumber: "LIC-003",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date("2026-09-15"),
        contactNumber: "+91-9876543212",
        safetyScore: 88,
        status: "AVAILABLE",
        region: "South",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "Mike Brown",
        licenseNumber: "LIC-004",
        licenseCategory: "LMV",
        licenseExpiryDate: new Date("2027-03-20"),
        contactNumber: "+91-9876543213",
        safetyScore: 92,
        status: "AVAILABLE",
        region: "East",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "Emma Davis",
        licenseNumber: "LIC-005",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date("2026-11-10"),
        contactNumber: "+91-9876543214",
        safetyScore: 87,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "David Wilson",
        licenseNumber: "LIC-006",
        licenseCategory: "LMV",
        licenseExpiryDate: new Date("2028-08-30"),
        contactNumber: "+91-9876543215",
        safetyScore: 75,
        status: "AVAILABLE",
        region: "Central",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "Lisa Anderson",
        licenseNumber: "LIC-007",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date("2028-02-15"),
        contactNumber: "+91-9876543216",
        safetyScore: 65,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    await prisma.driver.create({
      data: {
        name: "Tom Martinez",
        licenseNumber: "LIC-008",
        licenseCategory: "MC",
        licenseExpiryDate: new Date("2027-12-31"),
        contactNumber: "+91-9876543217",
        safetyScore: 45,
        status: "AVAILABLE",
        region: "South",
      },
    }),
  ];

  console.log("✓ Created 8 drivers");

  // Create trips
  const trip1 = await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      cargoWeight: 300,
      plannedDistance: 150,
      status: "COMPLETED",
      completedAt: new Date("2026-07-10"),
      dispatchedAt: new Date("2026-07-09"),
      startOdometer: 5000,
      endOdometer: 5150,
      fuelConsumed: 15,
      revenue: 2000,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Jaipur",
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
      cargoWeight: 800,
      plannedDistance: 250,
      status: "COMPLETED",
      completedAt: new Date("2026-07-09"),
      dispatchedAt: new Date("2026-07-08"),
      startOdometer: 15000,
      endOdometer: 15250,
      fuelConsumed: 28,
      revenue: 3500,
    },
  });

  const trip3 = await prisma.trip.create({
    data: {
      source: "Bangalore",
      destination: "Chennai",
      vehicleId: vehicles[2].id,
      driverId: drivers[2].id,
      cargoWeight: 350,
      plannedDistance: 350,
      status: "COMPLETED",
      completedAt: new Date("2026-07-08"),
      dispatchedAt: new Date("2026-07-07"),
      startOdometer: 8000,
      endOdometer: 8350,
      fuelConsumed: 32,
      revenue: 4000,
    },
  });

  const trip4 = await prisma.trip.create({
    data: {
      source: "Kolkata",
      destination: "Patna",
      vehicleId: vehicles[4].id,
      driverId: drivers[5].id,
      cargoWeight: 950,
      plannedDistance: 200,
      status: "DISPATCHED",
      dispatchedAt: new Date("2026-07-11"),
    },
  });

  const trip5 = await prisma.trip.create({
    data: {
      source: "Hyderabad",
      destination: "Vijayawada",
      vehicleId: vehicles[5].id,
      driverId: drivers[3].id,
      cargoWeight: 1500,
      plannedDistance: 180,
      status: "DISPATCHED",
      dispatchedAt: new Date("2026-07-11"),
    },
  });

  await prisma.trip.create({
    data: {
      source: "Ahmedabad",
      destination: "Surat",
      vehicleId: vehicles[0].id,
      driverId: drivers[1].id,
      cargoWeight: 200,
      plannedDistance: 300,
      status: "DRAFT",
    },
  });

  await prisma.trip.create({
    data: {
      source: "Lucknow",
      destination: "Kanpur",
      vehicleId: vehicles[2].id,
      driverId: drivers[2].id,
      cargoWeight: 250,
      plannedDistance: 80,
      status: "DRAFT",
    },
  });

  await prisma.trip.create({
    data: {
      source: "Pune",
      destination: "Mumbai",
      vehicleId: vehicles[1].id,
      driverId: drivers[4].id,
      cargoWeight: 700,
      plannedDistance: 150,
      status: "CANCELLED",
      cancelledAt: new Date("2026-07-05"),
    },
  });

  await prisma.trip.create({
    data: {
      source: "Chennai",
      destination: "Coimbatore",
      vehicleId: vehicles[3].id,
      driverId: drivers[0].id,
      cargoWeight: 80,
      plannedDistance: 180,
      status: "COMPLETED",
      completedAt: new Date("2026-07-06"),
      dispatchedAt: new Date("2026-07-05"),
      startOdometer: 3000,
      endOdometer: 3180,
      fuelConsumed: 12,
      revenue: 1500,
    },
  });

  console.log("✓ Created 10 trips");

  // Create fuel logs
  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[0].id,
      tripId: trip1.id,
      liters: 15,
      cost: 1350,
      date: new Date("2026-07-10"),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[1].id,
      tripId: trip2.id,
      liters: 28,
      cost: 2520,
      date: new Date("2026-07-09"),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[2].id,
      tripId: trip3.id,
      liters: 32,
      cost: 2880,
      date: new Date("2026-07-08"),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[0].id,
      liters: 10,
      cost: 900,
      date: new Date("2026-07-11"),
    },
  });

  console.log("✓ Created fuel logs");

  // Create maintenance logs
  const activeMaintenance = await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[6].id,
      type: "Oil Change",
      description: "Regular oil change service",
      cost: 500,
      status: "ACTIVE",
      startDate: new Date("2026-07-10"),
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[0].id,
      type: "Tire Replacement",
      description: "Replaced all 4 tires",
      cost: 3000,
      status: "CLOSED",
      startDate: new Date("2026-06-20"),
      endDate: new Date("2026-06-22"),
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[1].id,
      type: "Brake Service",
      description: "Brake pads and disc inspection",
      cost: 2000,
      status: "CLOSED",
      startDate: new Date("2026-06-15"),
      endDate: new Date("2026-06-16"),
    },
  });

  console.log("✓ Created maintenance logs");

  // Create expenses
  await prisma.expense.create({
    data: {
      vehicleId: vehicles[0].id,
      type: "TOLL",
      amount: 500,
      description: "Highway toll",
      date: new Date("2026-07-10"),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: vehicles[1].id,
      type: "TOLL",
      amount: 800,
      description: "Highway toll",
      date: new Date("2026-07-09"),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: vehicles[2].id,
      type: "MAINTENANCE",
      amount: 1500,
      description: "Parts replacement",
      date: new Date("2026-07-08"),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: vehicles[3].id,
      type: "OTHER",
      amount: 200,
      description: "Miscellaneous",
      date: new Date("2026-07-06"),
    },
  });

  console.log("✓ Created expenses");

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📝 Test credentials:");
  console.log(`  Fleet Manager: fleet@transitops.com / ${testPassword}`);
  console.log(`  Driver: driver@transitops.com / ${testPassword}`);
  console.log(`  Safety Officer: safety@transitops.com / ${testPassword}`);
  console.log(`  Financial Analyst: finance@transitops.com / ${testPassword}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
