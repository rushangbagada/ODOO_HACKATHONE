"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Eye, Trash2 } from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    regNumber: "",
    name: "",
    type: "",
    maxLoadCapacity: "",
    acquisitionCost: "",
    odometer: "0",
    region: "",
  });

  useEffect(() => {
    fetchUser();
    fetchVehicles();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("/api/vehicles");
      setVehicles(response.data.vehicles);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/vehicles", {
        ...formData,
        maxLoadCapacity: parseFloat(formData.maxLoadCapacity),
        acquisitionCost: parseFloat(formData.acquisitionCost),
        odometer: parseFloat(formData.odometer),
      });
      toast.success("Vehicle created successfully");
      setShowForm(false);
      setFormData({ regNumber: "", name: "", type: "", maxLoadCapacity: "", acquisitionCost: "", odometer: "0", region: "" });
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create vehicle");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getStatusColor = (status: string) => {
    const colors: any = {
      AVAILABLE: "bg-green-100 text-green-800",
      ON_TRIP: "bg-blue-100 text-blue-800",
      IN_SHOP: "bg-yellow-100 text-yellow-800",
      RETIRED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canCreateVehicles = user?.role === "FLEET_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicles</h1>
        {canCreateVehicles ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Vehicle
          </button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Only Fleet Managers can create vehicles
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Reg Number"
              value={formData.regNumber}
              onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Reg Number</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Max Load</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.regNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.type}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{vehicle.maxLoadCapacity} kg</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link href={`/vehicles/${vehicle.id}`} className="text-indigo-600 hover:text-indigo-700">
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
