"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Eye, ArrowUp, ArrowDown, Search } from "lucide-react";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "",
    licenseExpiryDate: "",
    contactNumber: "",
    safetyScore: "100",
    region: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchUser();
    fetchAllForFilterOptions();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchDrivers(), 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, regionFilter, sort, order]);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchAllForFilterOptions = async () => {
    try {
      const response = await axios.get("/api/drivers");
      const all = response.data.drivers as any[];
      setRegions(Array.from(new Set(all.map((d) => d.region).filter(Boolean))).sort());
    } catch (error) {
      console.error("Failed to load filter options");
    }
  };

  const fetchDrivers = async () => {
    try {
      const params: Record<string, string> = { sort, order };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;

      const response = await axios.get("/api/drivers", { params });
      setDrivers(response.data.drivers);
    } catch (error) {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/drivers", {
        ...formData,
        safetyScore: parseInt(formData.safetyScore),
      });
      toast.success("Driver created successfully");
      setShowForm(false);
      setFormData({
        name: "",
        licenseNumber: "",
        licenseCategory: "",
        licenseExpiryDate: "",
        contactNumber: "",
        safetyScore: "100",
        region: "",
      });
      fetchDrivers();
      fetchAllForFilterOptions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create driver");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      AVAILABLE: "bg-green-100 text-green-800",
      ON_TRIP: "bg-blue-100 text-blue-800",
      OFF_DUTY: "bg-gray-100 text-gray-800",
      SUSPENDED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const canCreateDrivers = user?.role === "FLEET_MANAGER";
  const isSafetyOfficer = user?.role === "SAFETY_OFFICER";

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      onClick={() => toggleSort(field)}
      className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600"
    >
      <span className="flex items-center gap-1">
        {children}
        {sort === field && (order === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
      </span>
    </th>
  );

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drivers</h1>
        {canCreateDrivers ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Driver
          </button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isSafetyOfficer
              ? "Safety officers can update safety scores and driver status"
              : "Only Fleet Managers can create drivers"}
          </div>
        )}
      </div>

      {isSafetyOfficer && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-semibold">Driver compliance workspace</p>
          <p className="text-sm mt-1">
            Review license expiry, adjust safety scores, and suspend or reinstate drivers before they are assigned to any trip.
          </p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {(search || statusFilter || regionFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setRegionFilter(""); }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="License Number"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="License Category"
              value={formData.licenseCategory}
              onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="date"
              placeholder="License Expiry Date"
              value={formData.licenseExpiryDate}
              onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="tel"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Region (optional)"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="licenseNumber">License</SortHeader>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
              <SortHeader field="licenseExpiryDate">Expiry</SortHeader>
              <SortHeader field="safetyScore">Safety Score</SortHeader>
              <SortHeader field="status">Status</SortHeader>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {drivers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No drivers match your filters.
                </td>
              </tr>
            )}
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{driver.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{driver.licenseNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{driver.licenseCategory}</td>
                <td className="px-6 py-4 text-sm">
                  {isLicenseExpired(driver.licenseExpiryDate) ? (
                    <span className="text-red-600 font-semibold">Expired</span>
                  ) : (
                    <span className={daysUntilExpiry(driver.licenseExpiryDate) <= 30 ? "text-yellow-600" : "text-gray-600"}>
                      {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{driver.safetyScore}/100</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link href={`/drivers/${driver.id}`} className="text-indigo-600 hover:text-indigo-700">
                    <Eye size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
