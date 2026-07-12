"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await axios.get("/api/reports/summary");
      setSummary(response.data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Completed Trips</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.completedTrips || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{(summary.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Operational Cost</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{(summary.totalOperationalCost || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Placeholder for reports */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Detailed Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Reports data is being computed from your vehicles, drivers, trips, and operational logs.
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>✓ Fuel Efficiency metrics</p>
          <p>✓ Fleet Utilization trends</p>
          <p>✓ Operational Cost breakdown</p>
          <p>✓ Vehicle ROI analysis</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Export Data</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Export reports in CSV format for further analysis:</p>
          <div className="flex flex-wrap gap-2">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
              Export Vehicles Summary
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
              Export Fuel Efficiency
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
              Export Operational Cost
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
              Export Vehicle ROI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
