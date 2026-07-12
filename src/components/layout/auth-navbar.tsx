"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface AuthNavbarProps {
  isAuthenticated?: boolean;
}

export function AuthNavbar({ isAuthenticated }: AuthNavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          TransitOps
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              {pathname !== "/signin" && (
                <Link href="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
              )}
              {pathname !== "/signup" && (
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
