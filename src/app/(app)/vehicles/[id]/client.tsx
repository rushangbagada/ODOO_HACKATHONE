"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2 } from "lucide-react";

export default function VehicleDetailClient({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchUser();
    fetchVehicle();
  }, [vehicleId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`/api/vehicles/${vehicleId}`);
      setVehicle(response.data.vehicle);
      setFormData(response.data.vehicle);
    } catch (error) {
      toast.error("Failed to load vehicle");
      router.push("/vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/vehicles/${vehicleId}`, {
        name: formData.name,
        type: formData.type,
        maxLoadCapacity: parseInt(formData.maxLoadCapacity),
        acquisitionCost: parseInt(formData.acquisitionCost),
        odometer: parseInt(formData.odometer),
        region: formData.region,
        status: formData.status,
      });
      toast.success("Vehicle updated successfully");
      setEditing(false);
      fetchVehicle();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update vehicle");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="text-center py-8 text-red-600">Vehicle not found</div>;
  }

  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    ON_TRIP: "bg-blue-100 text-blue-800",
    IN_SHOP: "bg-orange-100 text-orange-800",
    RETIRED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/vehicles")}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {vehicle.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{vehicle.regNumber}</p>
          </div>
        </div>
        {user?.role === "FLEET_MANAGER" ? (
          <button
            onClick={() => setEditing(!editing)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Edit2 size={16} /> {editing ? "Cancel" : "Edit"}
          </button>
        ) : (
          <div className="text-sm text-gray-500">View only</div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Load Capacity (kg)
              </label>
              <input
                type="number"
                value={formData.maxLoadCapacity}
                onChange={(e) => setFormData({ ...formData, maxLoadCapacity: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Acquisition Cost (₹)
              </label>
              <input
                type="number"
                value={formData.acquisitionCost}
                onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Odometer (km)
              </label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_SHOP">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registration Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.regNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Max Load Capacity</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.maxLoadCapacity} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acquisition Cost</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{vehicle.acquisitionCost.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[vehicle.status as keyof typeof statusColors]
                }`}
              >
                {vehicle.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Odometer Reading</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.odometer.toLocaleString()} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Region</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.region}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(vehicle.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {vehicle.trips && vehicle.trips.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Trips ({vehicle.trips.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Route</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Distance</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.trips.slice(0, 5).map((trip: any) => (
                  <tr key={trip.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{trip.source} → {trip.destination}</td>
                    <td className="px-4 py-2">{trip.plannedDistance} km</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">₹{trip.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
