"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Archive, ArrowUp, ArrowDown, Search } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

const emptyForm = {
  regNumber: "",
  name: "",
  type: "",
  maxLoadCapacity: "",
  acquisitionCost: "",
  odometer: "0",
  region: "",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ types: string[]; regions: string[] }>({ types: [], regions: [] });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchUser();
    fetchAllForFilterOptions();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchVehicles(), 250);
    return () => clearTimeout(timeout);
  }, [search, typeFilter, statusFilter, regionFilter, sort, order]);

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
      const response = await axios.get("/api/vehicles");
      const all = response.data.vehicles as any[];
      setFilterOptions({
        types: Array.from(new Set(all.map((v) => v.type))).sort(),
        regions: Array.from(new Set(all.map((v) => v.region).filter(Boolean))).sort(),
      });
    } catch (error) {
      console.error("Failed to load filter options");
    }
  };

  const fetchVehicles = async () => {
    try {
      const params: Record<string, string> = { sort, order };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;

      const response = await axios.get("/api/vehicles", { params });
      setVehicles(response.data.vehicles);
    } catch (error) {
      toast.error("Failed to load vehicles");
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

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (vehicle: any) => {
    setEditingId(vehicle.id);
    setFormData({
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: String(vehicle.maxLoadCapacity),
      acquisitionCost: String(vehicle.acquisitionCost),
      odometer: String(vehicle.odometer),
      region: vehicle.region || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maxLoadCapacity: parseFloat(formData.maxLoadCapacity),
        acquisitionCost: parseFloat(formData.acquisitionCost),
        odometer: parseFloat(formData.odometer),
      };

      if (editingId) {
        const { regNumber, ...updatable } = payload;
        await axios.patch(`/api/vehicles/${editingId}`, updatable);
        toast.success("Vehicle updated successfully");
      } else {
        await axios.post("/api/vehicles", payload);
        toast.success("Vehicle created successfully");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchVehicles();
      fetchAllForFilterOptions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save vehicle");
    }
  };

  const handleRetire = async (vehicle: any) => {
    if (!confirm(`Retire ${vehicle.regNumber}? It will no longer be available for dispatch.`)) return;
    try {
      await axios.patch(`/api/vehicles/${vehicle.id}`, { status: "RETIRED" });
      toast.success("Vehicle retired");
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to retire vehicle");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      AVAILABLE: "bg-green-100 text-green-800",
      ON_TRIP: "bg-blue-100 text-blue-800",
      IN_SHOP: "bg-yellow-100 text-yellow-800",
      RETIRED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canManageVehicles = user?.role === "FLEET_MANAGER";

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

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicles</h1>
        {canManageVehicles ? (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus size={20} />
            New Vehicle
          </button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            View Only Access
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reg number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Types</option>
          {filterOptions.types.map((t) => (
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
          {filterOptions.regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {(search || typeFilter || statusFilter || regionFilter) && (
          <button
            onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter(""); setRegionFilter(""); }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? "Edit Vehicle" : "New Vehicle"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Reg Number"
              value={formData.regNumber}
              onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
              required
              disabled={!!editingId}
              title={editingId ? "Registration number cannot be changed" : undefined}
            />
            <input
              type="text"
              placeholder="Vehicle Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Type (Van, Truck, etc)"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Max Load (kg)"
              value={formData.maxLoadCapacity}
              onChange={(e) => setFormData({ ...formData, maxLoadCapacity: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Acquisition Cost"
              value={formData.acquisitionCost}
              onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Odometer (km)"
              value={formData.odometer}
              onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <SortHeader field="regNumber">Reg Number</SortHeader>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="maxLoadCapacity">Max Load</SortHeader>
              <SortHeader field="status">Status</SortHeader>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Region</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={40} className="text-gray-300 dark:text-gray-600" />
                    <p className="font-medium">No vehicles found</p>
                    <p className="text-xs">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{vehicle.regNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{vehicle.type}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.maxLoadCapacity} kg</td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={
                    vehicle.status === "AVAILABLE" ? "success" :
                    vehicle.status === "ON_TRIP" ? "info" :
                    vehicle.status === "IN_SHOP" ? "warning" : "default"
                  }>
                    {vehicle.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{vehicle.region || "—"}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Link href={`/vehicles/${vehicle.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors" title="View Details">
                      <Eye size={18} />
                    </Link>
                    {canManageVehicles && (
                      <>
                        <button onClick={() => openEditForm(vehicle)} className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" title="Edit">
                          <Pencil size={18} />
                        </button>
                        {vehicle.status !== "RETIRED" && (
                          <button
                            onClick={() => handleRetire(vehicle)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retire Vehicle"
                            disabled={vehicle.status === "ON_TRIP"}
                          >
                            <Archive size={18} className={vehicle.status === "ON_TRIP" ? "opacity-30 cursor-not-allowed" : ""} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
