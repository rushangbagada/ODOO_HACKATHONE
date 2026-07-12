import { describe, expect, it } from "vitest";
import { can, canRead, canCreate, canUpdate, canDelete } from "./permissions";

type Role = "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
const ROLES: Role[] = ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];

// The exact permission matrix each role is supposed to have, per the spec's
// role definitions (§2 of the TransitOps brief). Any drift from this table is
// a regression, not a style choice.
const EXPECTED: Record<Role, string[]> = {
  FLEET_MANAGER: [
    "vehicles.read", "vehicles.create", "vehicles.update", "vehicles.delete",
    "drivers.read", "drivers.create", "drivers.update", "drivers.delete",
    "trips.read", "trips.create", "trips.update", "trips.dispatch", "trips.complete", "trips.cancel",
    "maintenance.read", "maintenance.create", "maintenance.close",
    "fuel.read", "fuel.create",
    "expenses.read", "expenses.create",
    "dashboard.read", "reports.read",
  ],
  DRIVER: [
    "vehicles.read", "drivers.read",
    "trips.read", "trips.create", "trips.update", "trips.dispatch", "trips.complete", "trips.cancel",
    "fuel.read", "fuel.create",
    "dashboard.read", "reports.read",
  ],
  SAFETY_OFFICER: [
    "drivers.read", "drivers.update",
    "dashboard.read", "reports.read",
  ],
  FINANCIAL_ANALYST: [
    "vehicles.read",
    "trips.read",
    "maintenance.read",
    "fuel.read", "fuel.create",
    "expenses.read", "expenses.create",
    "dashboard.read", "reports.read",
  ],
};

// Every permission key that exists anywhere in the app, so we can assert the
// negative space too (what a role must NOT have), not just the positive list.
const ALL_ACTIONS = Array.from(new Set(Object.values(EXPECTED).flat()));

describe("permissions matrix", () => {
  for (const role of ROLES) {
    describe(role, () => {
      for (const action of ALL_ACTIONS) {
        const shouldHave = EXPECTED[role].includes(action);
        it(`${shouldHave ? "grants" : "denies"} ${action}`, () => {
          expect(can(role, action)).toBe(shouldHave);
        });
      }
    });
  }

  it("returns false for an unknown action on a valid role", () => {
    expect(can("FLEET_MANAGER", "warp_drive.engage")).toBe(false);
  });

  it("returns false for a role with no explicit permission entry", () => {
    expect(can("UNKNOWN" as Role, "vehicles.read")).toBe(false);
  });
});

describe("role boundaries (the parts that must never regress)", () => {
  it("Fleet Manager owns asset lifecycle; Driver only operates trips", () => {
    for (const action of ["vehicles.create", "vehicles.update", "vehicles.delete", "drivers.create", "drivers.update", "drivers.delete", "maintenance.create", "maintenance.close"]) {
      expect(can("FLEET_MANAGER", action)).toBe(true);
      expect(can("DRIVER", action)).toBe(false);
    }
  });

  it("Driver has full trip lifecycle control", () => {
    for (const action of ["trips.create", "trips.dispatch", "trips.complete", "trips.cancel"]) {
      expect(can("DRIVER", action)).toBe(true);
    }
  });

  it("Safety Officer is scoped to driver compliance only", () => {
    for (const action of ["vehicles.read", "trips.read", "maintenance.read", "fuel.read", "expenses.read"]) {
      expect(can("SAFETY_OFFICER", action)).toBe(false);
    }
    expect(can("SAFETY_OFFICER", "drivers.read")).toBe(true);
    expect(can("SAFETY_OFFICER", "drivers.update")).toBe(true);
  });

  it("Financial Analyst can review costs but not manage drivers or trips", () => {
    expect(can("FINANCIAL_ANALYST", "drivers.read")).toBe(false);
    expect(can("FINANCIAL_ANALYST", "trips.create")).toBe(false);
    expect(can("FINANCIAL_ANALYST", "expenses.create")).toBe(true);
    expect(can("FINANCIAL_ANALYST", "fuel.create")).toBe(true);
  });

  it("only Fleet Manager can delete vehicles or drivers", () => {
    for (const role of ROLES) {
      const expected = role === "FLEET_MANAGER";
      expect(can(role, "vehicles.delete")).toBe(expected);
      expect(can(role, "drivers.delete")).toBe(expected);
    }
  });

  it("every role can read its own dashboard and reports", () => {
    for (const role of ROLES) {
      expect(can(role, "dashboard.read")).toBe(true);
      expect(can(role, "reports.read")).toBe(true);
    }
  });
});

describe("canRead / canCreate / canUpdate / canDelete helpers", () => {
  it("canRead derives from `${resource}.read`", () => {
    expect(canRead("FLEET_MANAGER", "vehicles")).toBe(true);
    expect(canRead("SAFETY_OFFICER", "vehicles")).toBe(false);
  });

  it("canCreate derives from `${resource}.create`", () => {
    expect(canCreate("DRIVER", "trips")).toBe(true);
    expect(canCreate("SAFETY_OFFICER", "trips")).toBe(false);
  });

  it("canUpdate derives from `${resource}.update`", () => {
    expect(canUpdate("SAFETY_OFFICER", "drivers")).toBe(true);
    expect(canUpdate("DRIVER", "drivers")).toBe(false);
  });

  it("canDelete derives from `${resource}.delete`", () => {
    expect(canDelete("FLEET_MANAGER", "vehicles")).toBe(true);
    expect(canDelete("FLEET_MANAGER", "trips")).toBe(false);
  });
});
