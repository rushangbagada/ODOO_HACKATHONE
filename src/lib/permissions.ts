type Role = "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

const permissions: Record<Role, Record<string, boolean>> = {
  FLEET_MANAGER: {
    "vehicles.read": true,
    "vehicles.create": true,
    "vehicles.update": true,
    "vehicles.delete": true,
    "drivers.read": true,
    "drivers.create": true,
    "drivers.update": true,
    "drivers.delete": true,
    "trips.read": true,
    "trips.create": true,
    "trips.update": true,
    "trips.dispatch": true,
    "trips.complete": true,
    "trips.cancel": true,
    "maintenance.read": true,
    "maintenance.create": true,
    "maintenance.close": true,
    "fuel.read": true,
    "fuel.create": true,
    "expenses.read": true,
    "expenses.create": true,
    "dashboard.read": true,
    "reports.read": true,
  },
  DRIVER: {
    "vehicles.read": true,
    "maintenance.read": true,
    "trips.read": true,
    "dashboard.read": true,
    "reports.read": true,
  },
  SAFETY_OFFICER: {
    "vehicles.read": true,
    "drivers.read": true,
    "drivers.update": true,
    "trips.read": true,
    "maintenance.read": true,
    "fuel.read": true,
    "expenses.read": true,
    "dashboard.read": true,
    "reports.read": true,
  },
  FINANCIAL_ANALYST: {
    "vehicles.read": true,
    "trips.read": true,
    "maintenance.read": true,
    "fuel.read": true,
    "fuel.create": true,
    "expenses.read": true,
    "expenses.create": true,
    "dashboard.read": true,
    "reports.read": true,
  },
};

export function can(role: Role, action: string): boolean {
  return permissions[role]?.[action] ?? false;
}

export function canRead(role: Role, resource: string): boolean {
  return can(role, `${resource}.read`);
}

export function canCreate(role: Role, resource: string): boolean {
  return can(role, `${resource}.create`);
}

export function canUpdate(role: Role, resource: string): boolean {
  return can(role, `${resource}.update`);
}

export function canDelete(role: Role, resource: string): boolean {
  return can(role, `${resource}.delete`);
}
