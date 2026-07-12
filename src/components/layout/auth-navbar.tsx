"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthNavbarProps {
  isAuthenticated?: boolean;
}

export function AuthNavbar({ isAuthenticated }: AuthNavbarProps) {
  const pathname = usePathname();

  return (
    <div className="w-full px-6 py-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          TransitOps
        </Link>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              {pathname !== "/signin" && (
                <Link href="/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
              )}
              {pathname !== "/signup" && (
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
