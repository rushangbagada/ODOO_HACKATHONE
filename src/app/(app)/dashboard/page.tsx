"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Truck, AlertCircle, TrendingUp, TrendingDown, Clock, Mail, ShieldCheck, CheckCircle, MapPin, Wallet, Fuel, Wrench, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [typeFilter, statusFilter, regionFilter]);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchDashboard = async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;

      const response = await axios.get("/api/dashboard", { params });
      setData(response.data);
    } catch (error: any) {
      toast.error("Failed to load dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await axios.post("/api/notifications/license-reminders");
      toast.success(response.data.message || "Reminder email sent");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div>Error loading data</div>;

  // Custom tooltip to avoid rendering objects
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const KPICard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (data.role === "DRIVER") {
    const { driver, completedTripsCount, activeTrip, myTrips } = data;

    if (!driver) {
      return (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          No driver profile found for your account. Contact your Fleet Manager.
        </div>
      );
    }

    const today = new Date();
    const licenseExpiry = new Date(driver.licenseExpiryDate);
    const daysToExpiry = Math.ceil((licenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const licenseStatus =
      daysToExpiry < 0 ? "Expired" : daysToExpiry <= 30 ? "Expiring Soon" : "Valid";
    const licenseColor =
      daysToExpiry < 0 ? "#ef4444" : daysToExpiry <= 30 ? "#f59e0b" : "#10b981";

    const statusColors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      DISPATCHED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {driver.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Trips</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{completedTripsCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4" style={{ borderLeftColor: "#8b5cf6" }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Safety Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{driver.safetyScore}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ShieldCheck size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, driver.safetyScore))}%`,
                  backgroundColor: driver.safetyScore >= 80 ? "#10b981" : driver.safetyScore >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4" style={{ borderLeftColor: licenseColor }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">License Status</p>
                <p className="text-xl font-bold mt-1" style={{ color: licenseColor }}>{licenseStatus}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Expires: {licenseExpiry.toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${licenseColor}20` }}>
                <AlertCircle size={24} style={{ color: licenseColor }} />
              </div>
            </div>
          </div>
        </div>

        {activeTrip ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4" style={{ borderLeftColor: "#3b82f6" }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" /> Active Trip
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Route</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {activeTrip.source} → {activeTrip.destination}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-white">{activeTrip.vehicle.name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Cargo Weight</p>
                <p className="font-medium text-gray-900 dark:text-white">{activeTrip.cargoWeight} kg</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Planned Distance</p>
                <p className="font-medium text-gray-900 dark:text-white">{activeTrip.plannedDistance} km</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Dispatched</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {activeTrip.dispatchedAt ? new Date(activeTrip.dispatchedAt).toLocaleString() : "-"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500 dark:text-gray-400">
            No active trip right now.
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Trips</h3>
          {myTrips.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No trips assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Route</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Cargo</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTrips.map((trip: any) => (
                    <tr key={trip.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{trip.source} → {trip.destination}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{trip.vehicle.name}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{trip.cargoWeight} kg</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[trip.status] || "bg-gray-100 text-gray-800"}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.role === "FINANCIAL_ANALYST") {
    const {
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      totalOperationalCost,
      netMargin,
      completedTripsCount,
      costBreakdown,
      revenueCostTrend,
      topVehiclesByCost,
    } = data;

    const COST_COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={Wallet} color="#10b981" />
          <KPICard label="Total Operational Cost" value={`₹${totalOperationalCost.toFixed(2)}`} icon={Receipt} color="#ef4444" />
          <KPICard
            label="Net Margin"
            value={`₹${netMargin.toFixed(2)}`}
            icon={netMargin >= 0 ? TrendingUp : TrendingDown}
            color={netMargin >= 0 ? "#10b981" : "#ef4444"}
          />
          <KPICard label="Completed Trips" value={completedTripsCount} icon={CheckCircle} color="#3b82f6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard label="Fuel Cost" value={`₹${totalFuelCost.toFixed(2)}`} icon={Fuel} color="#f59e0b" />
          <KPICard label="Maintenance Cost" value={`₹${totalMaintenanceCost.toFixed(2)}`} icon={Wrench} color="#8b5cf6" />
          <KPICard label="Tolls & Other Expenses" value={`₹${totalExpenseCost.toFixed(2)}`} icon={Receipt} color="#ec4899" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {costBreakdown.map((_: any, index: number) => (
                    <Cell key={index} fill={COST_COLORS[index % COST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue vs Cost (Last 14 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueCostTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
                <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Vehicles by Operational Cost</h3>
          {topVehiclesByCost.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No vehicle cost data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Revenue</th>
                    <th className="py-2 pr-4">Operational Cost</th>
                    <th className="py-2 pr-4">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {topVehiclesByCost.map((v: any) => (
                    <tr key={v.vehicleId} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{v.name} ({v.regNumber})</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">₹{v.revenue.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">₹{v.operationalCost.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{v.roi !== null ? v.roi : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { metrics, alerts, tripsByStatus, fleetComposition, utilizationTrend, filterOptions } = data;
  const canSendReminders = user?.role === "FLEET_MANAGER" || user?.role === "SAFETY_OFFICER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            {filterOptions?.types?.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Regions</option>
            {filterOptions?.regions?.map((r: string) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {(typeFilter || statusFilter || regionFilter) && (
            <button
              onClick={() => { setTypeFilter(""); setStatusFilter(""); setRegionFilter(""); }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Vehicles"
          value={metrics.activeVehicles}
          icon={Truck}
          color="#3b82f6"
        />
        <KPICard
          label="Available Vehicles"
          value={metrics.availableVehicles}
          icon={Truck}
          color="#10b981"
        />
        <KPICard
          label="In Maintenance"
          value={metrics.vehiclesInMaintenance}
          icon={AlertCircle}
          color="#f59e0b"
        />
        <KPICard
          label="Active Trips"
          value={metrics.activeTrips}
          icon={TrendingUp}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Pending Trips"
          value={metrics.pendingTrips}
          icon={Clock}
          color="#ec4899"
        />
        <KPICard
          label="Drivers On Duty"
          value={metrics.driversOnDuty}
          icon={Truck}
          color="#06b6d4"
        />
        <KPICard
          label="Fleet Utilization %"
          value={`${metrics.fleetUtilization}%`}
          icon={TrendingUp}
          color="#14b8a6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips by Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trips by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tripsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Composition */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Fleet Composition{statusFilter ? ` (${statusFilter.replace(/_/g, " ")})` : ""}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fleetComposition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Utilization Trend */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trips Completed (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={utilizationTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="trips" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Compliance Alerts */}
      {(alerts.expiredLicenses.length > 0 || alerts.expiringSoon.length > 0 || alerts.activeMaintenanceLogs.length > 0) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Compliance Alerts
            </h3>
            {canSendReminders && (alerts.expiredLicenses.length > 0 || alerts.expiringSoon.length > 0) && (
              <button
                onClick={handleSendReminders}
                disabled={sendingReminders}
                className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Mail size={14} /> {sendingReminders ? "Sending..." : "Email License Reminders"}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {alerts.expiredLicenses.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">Expired Licenses ({alerts.expiredLicenses.length})</p>
                <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                  {alerts.expiredLicenses.slice(0, 3).map((driver: any) => (
                    <li key={driver.id}>• {driver.name} (License expired)</li>
                  ))}
                </ul>
              </div>
            )}

            {alerts.expiringSoon.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Licenses Expiring Soon ({alerts.expiringSoon.length})</p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  {alerts.expiringSoon.slice(0, 3).map((driver: any) => (
                    <li key={driver.id}>• {driver.name} (Expires: {new Date(driver.licenseExpiryDate).toLocaleDateString()})</li>
                  ))}
                </ul>
              </div>
            )}

            {alerts.activeMaintenanceLogs.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Active Maintenance ({alerts.activeMaintenanceLogs.length})</p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  {alerts.activeMaintenanceLogs.slice(0, 3).map((log: any) => (
                    <li key={log.id}>• {log.vehicle.name} - {log.type}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
