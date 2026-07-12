"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
    fetchVehicles();
    fetchTrips();
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

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("/api/vehicles");
      setVehicles(response.data.vehicles || []);
    } catch (error: any) {
      console.error("Failed to load vehicles:", error);
      toast.error(error.response?.data?.error || "Failed to load vehicles for export");
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await axios.get("/api/trips");
      setTrips(response.data.trips || []);
    } catch (error: any) {
      console.error("Failed to load trips:", error);
      toast.error(error.response?.data?.error || "Failed to load trips for export");
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data available to export. Please ensure data has been loaded.");
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header];
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`;
            }
            return value ?? "";
          }).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records successfully`);
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to generate CSV file");
    }
  };

  const handleExportVehicles = () => {
    const data = vehicles.map((v) => ({
      "Reg Number": v.regNumber,
      Name: v.name,
      Type: v.type,
      "Max Capacity": v.maxLoadCapacity,
      "Acquisition Cost": v.acquisitionCost,
      Odometer: v.odometer,
      Status: v.status,
      Region: v.region,
    }));
    downloadCSV(data, "vehicles-summary");
  };

  const handleExportFuelEfficiency = () => {
    const fuelData = trips
      .filter((t) => t.status === "COMPLETED")
      .map((t) => ({
        "Trip ID": t.id,
        Vehicle: t.vehicle?.name || "N/A",
        Distance: t.actualDistance || t.plannedDistance,
        "Fuel Consumed": t.fuelConsumed,
        "Efficiency (km/l)": t.actualDistance && t.fuelConsumed
          ? (t.actualDistance / t.fuelConsumed).toFixed(2)
          : "N/A",
      }));
    downloadCSV(fuelData, "fuel-efficiency");
  };

  const handleExportOperationalCost = () => {
    const data = [
      {
        Category: "Total Revenue",
        Amount: summary?.totalRevenue || 0,
      },
      {
        Category: "Fuel Cost",
        Amount: summary?.totalFuelCost || 0,
      },
      {
        Category: "Maintenance Cost",
        Amount: summary?.totalMaintenanceCost || 0,
      },
      {
        Category: "Expense Cost",
        Amount: summary?.totalExpenseCost || 0,
      },
      {
        Category: "Total Operational Cost",
        Amount: summary?.totalOperationalCost || 0,
      },
    ];
    downloadCSV(data, "operational-cost");
  };

  const handleExportVehicleROI = () => {
    const data = vehicles.map((v) => ({
      "Vehicle": v.name,
      "Acquisition Cost": v.acquisitionCost,
      "Total Trips": trips.filter((t) => t.vehicleId === v.id).length,
      "Total Revenue": trips
        .filter((t) => t.vehicleId === v.id && t.status === "COMPLETED")
        .reduce((sum, t) => sum + t.revenue, 0),
    }));
    downloadCSV(data, "vehicle-roi");
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
            <button
              onClick={handleExportVehicles}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <Download size={16} /> Export Vehicles Summary
            </button>
            <button
              onClick={handleExportFuelEfficiency}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <Download size={16} /> Export Fuel Efficiency
            </button>
            <button
              onClick={handleExportOperationalCost}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <Download size={16} /> Export Operational Cost
            </button>
            <button
              onClick={handleExportVehicleROI}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <Download size={16} /> Export Vehicle ROI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
