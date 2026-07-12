"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Printer } from "lucide-react";

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

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data available to export.");
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
      link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
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

  const perVehicle: any[] = summary?.perVehicle || [];

  const handleExportVehicles = () => {
    downloadCSV(
      perVehicle.map((v) => ({
        "Reg Number": v.regNumber,
        Name: v.name,
        Type: v.type,
        Status: v.status,
        "Acquisition Cost": v.acquisitionCost,
      })),
      "vehicles-summary"
    );
  };

  const handleExportFuelEfficiency = () => {
    downloadCSV(
      perVehicle.map((v) => ({
        Vehicle: `${v.name} (${v.regNumber})`,
        "Completed Trips": v.completedTrips,
        "Total Distance (km)": v.totalDistance,
        "Total Fuel (L)": v.totalFuelLiters,
        "Efficiency (km/l)": v.fuelEfficiency ?? "N/A",
      })),
      "fuel-efficiency"
    );
  };

  const handleExportOperationalCost = () => {
    downloadCSV(
      perVehicle.map((v) => ({
        Vehicle: `${v.name} (${v.regNumber})`,
        "Fuel Cost": v.fuelCost,
        "Maintenance Cost": v.maintenanceCost,
        "Other Expenses": v.expenseCost,
        "Total Operational Cost": v.operationalCost,
      })),
      "operational-cost"
    );
  };

  const handleExportVehicleROI = () => {
    downloadCSV(
      perVehicle.map((v) => ({
        Vehicle: `${v.name} (${v.regNumber})`,
        "Acquisition Cost": v.acquisitionCost,
        Revenue: v.revenue,
        "Fuel + Maintenance Cost": v.fuelCost + v.maintenanceCost,
        ROI: v.roi ?? "N/A",
      })),
      "vehicle-roi"
    );
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No report data available</p>
      </div>
    );
  }

  const fuelEffData = perVehicle
    .filter((v) => v.fuelEfficiency !== null)
    .map((v) => ({ name: v.regNumber, value: v.fuelEfficiency }));

  const costData = perVehicle.map((v) => ({ name: v.regNumber, value: v.operationalCost }));

  const roiData = perVehicle
    .filter((v) => v.roi !== null)
    .map((v) => ({ name: v.regNumber, value: v.roi }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fleet Utilization</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.fleetUtilization || 0}%
          </p>
        </div>
      </div>

      {/* Fuel Efficiency */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Fuel Efficiency (km/L)</h2>
        {fuelEffData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fuelEffData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No fuel data recorded yet.</p>
        )}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Vehicle</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Distance (km)</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fuel (L)</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Efficiency (km/L)</th>
              </tr>
            </thead>
            <tbody>
              {perVehicle.map((v) => (
                <tr key={v.vehicleId} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{v.name} ({v.regNumber})</td>
                  <td className="px-4 py-2">{v.totalDistance}</td>
                  <td className="px-4 py-2">{v.totalFuelLiters}</td>
                  <td className="px-4 py-2">{v.fuelEfficiency ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Cost */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Operational Cost per Vehicle (₹)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Vehicle</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fuel</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Maintenance</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Other Expenses</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Total</th>
              </tr>
            </thead>
            <tbody>
              {perVehicle.map((v) => (
                <tr key={v.vehicleId} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{v.name} ({v.regNumber})</td>
                  <td className="px-4 py-2">₹{v.fuelCost.toFixed(2)}</td>
                  <td className="px-4 py-2">₹{v.maintenanceCost.toFixed(2)}</td>
                  <td className="px-4 py-2">₹{v.expenseCost.toFixed(2)}</td>
                  <td className="px-4 py-2 font-semibold">₹{v.operationalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle ROI */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vehicle ROI</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
        </p>
        {roiData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {roiData.map((d, i) => (
                  <Cell key={i} fill={d.value >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data to compute ROI yet.</p>
        )}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Vehicle</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Revenue</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fuel + Maintenance</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Acquisition Cost</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">ROI</th>
              </tr>
            </thead>
            <tbody>
              {perVehicle.map((v) => (
                <tr key={v.vehicleId} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{v.name} ({v.regNumber})</td>
                  <td className="px-4 py-2">₹{v.revenue.toFixed(2)}</td>
                  <td className="px-4 py-2">₹{(v.fuelCost + v.maintenanceCost).toFixed(2)}</td>
                  <td className="px-4 py-2">₹{v.acquisitionCost.toFixed(2)}</td>
                  <td className={`px-4 py-2 font-semibold ${v.roi !== null && v.roi < 0 ? "text-red-600" : "text-green-600"}`}>
                    {v.roi !== null ? `${(v.roi * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="no-print bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
