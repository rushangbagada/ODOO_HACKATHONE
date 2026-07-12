"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/verify-session");
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      router.push("/signin");
      router.refresh();
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight hover:opacity-90 transition-opacity">
              TransitOps
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 h-16">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                  pathname === "/"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-750"
                }`}
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    pathname === "/dashboard"
                      ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                      : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-750"
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {user?.role === "FLEET_MANAGER" && (
                <Link
                  href="/admin/users"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    pathname === "/admin/users"
                      ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                      : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-750"
                  }`}
                >
                  User Approval
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Hi, {user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
