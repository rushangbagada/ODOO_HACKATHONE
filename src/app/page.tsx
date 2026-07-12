import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Fleet Management Made Simple
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Manage your fleet operations efficiently with TransitOps. Track vehicles, drivers, trips, and analytics in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">Open Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2026 TransitOps. All rights reserved.</p>
      </footer>
    </div>
  );
}
