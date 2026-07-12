"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3 } from "lucide-react";
import { can } from "@/lib/permissions";
import clsx from "clsx";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, resource: "dashboard", action: "read" },
  { label: "Vehicles", href: "/vehicles", icon: Truck, resource: "vehicles", action: "read" },
  { label: "Drivers", href: "/drivers", icon: Users, resource: "drivers", action: "read" },
  { label: "Trips", href: "/trips", icon: Route, resource: "trips", action: "read" },
  { label: "Maintenance", href: "/maintenance", icon: Wrench, resource: "maintenance", action: "read" },
  { label: "Fuel & Expenses", href: "/fuel-expenses", icon: Fuel, resource: "fuel", action: "read" },
  { label: "Reports", href: "/reports", icon: BarChart3, resource: "reports", action: "read" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-indigo-900 text-white">
      <div className="flex items-center justify-center h-16 bg-indigo-950 border-b border-indigo-800">
        <h1 className="text-xl font-bold">TransitOps</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const hasAccess = can(user.role as any, `${item.resource}.${item.action}`);
          if (!hasAccess) return null;

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-800 text-white"
                  : "text-indigo-100 hover:bg-indigo-800"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-indigo-800 p-4">
        <p className="text-sm text-indigo-200">{user.name}</p>
        <p className="text-xs text-indigo-300 capitalize">{user.role.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
}
