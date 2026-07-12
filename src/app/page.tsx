import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { Truck, BarChart3, Users, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Integrated Header in Hero */}
      <div className="w-full px-6 py-4">
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
                <Link href="/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl text-center">
          <div className="mb-6 inline-block">
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-semibold">
              ✨ Modern Fleet Management Platform
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Fleet Management <br />
            <span className="text-indigo-600 dark:text-indigo-400">Made Simple</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage your fleet operations efficiently with TransitOps. Track vehicles, drivers, trips, and analytics in one powerful platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="min-w-[200px]">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="min-w-[200px]">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="min-w-[200px]">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Vehicle Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time fleet monitoring and management</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Driver Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your team efficiently</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics & Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data-driven insights and reports</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Compliance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stay regulation-compliant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 text-center bg-white dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">&copy; 2026 TransitOps. All rights reserved.</p>
      </footer>
    </div>
  );
}
