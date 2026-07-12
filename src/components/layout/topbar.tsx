"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface TopbarProps {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

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

  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          TransitOps
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              isActive("/dashboard")
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/vehicles"
            className={`text-sm font-medium transition-colors ${
              isActive("/vehicles")
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Vehicles
          </Link>
          <Link
            href="/drivers"
            className={`text-sm font-medium transition-colors ${
              isActive("/drivers")
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Drivers
          </Link>
          <Link
            href="/trips"
            className={`text-sm font-medium transition-colors ${
              isActive("/trips")
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Trips
          </Link>
          <Link
            href="/reports"
            className={`text-sm font-medium transition-colors ${
              isActive("/reports")
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Reports
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Hi, {user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user.role.replace(/_/g, " ")}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
        >
          <LogOut size={16} />
          Logout
        </button>

        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
}
