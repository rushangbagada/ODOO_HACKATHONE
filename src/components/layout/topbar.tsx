"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { can } from "@/lib/permissions";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopbarProps {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", resource: "dashboard" },
  { label: "Vehicles", href: "/vehicles", resource: "vehicles" },
  { label: "Drivers", href: "/drivers", resource: "drivers" },
  { label: "Trips", href: "/trips", resource: "trips" },
  { label: "Maintenance", href: "/maintenance", resource: "maintenance" },
  { label: "Fuel & Expenses", href: "/fuel-expenses", resource: "fuel" },
  { label: "Reports", href: "/reports", resource: "reports" },
  { label: "Admin Panel", href: "/admin/users", resource: "admin", roleOnly: "FLEET_MANAGER" },
];

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      router.push("/signin");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const visibleNavItems = navItems.filter((item: any) => {
    if (item.roleOnly) {
      return user.role === item.roleOnly;
    }
    return can(user.role as any, `${item.resource}.read`);
  });

  return (
    <div className="no-print bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            TransitOps
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden lg:flex items-center gap-3 px-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Hi, {user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user.role.replace(/_/g, " ")}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
          >
            <LogOut size={16} />
            Logout
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 space-y-3">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`block text-sm font-medium py-1 ${
                isActive(item.href)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-3">
              {user.role.replace(/_/g, " ")}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
