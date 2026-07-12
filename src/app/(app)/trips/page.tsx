"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, CheckCircle, Zap, X } from "lucide-react";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeight: "",
    plannedDistance: "",
  });

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get("/api/trips");
      setTrips(response.data.trips);
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("/api/vehicles");
      setVehicles(response.data.vehicles.filter((v: any) => v.status === "AVAILABLE"));
    } catch (error) {
      console.error("Failed to load vehicles");
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get("/api/drivers");
      const today = new Date();
      setDrivers(
        response.data.drivers.filter(
          (d: any) => d.status === "AVAILABLE" && new Date(d.licenseExpiryDate) > today
        )
      );
    } catch (error) {
      console.error("Failed to load drivers");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/trips", {
        ...formData,
        cargoWeight: parseFloat(formData.cargoWeight),
        plannedDistance: parseFloat(formData.plannedDistance),
      });
      toast.success("Trip created successfully");
      setShowForm(false);
      setFormData({
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeight: "",
        plannedDistance: "",
      });
      fetchTrips();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create trip");
    }
  };

  const handleDispatch = async (tripId: string) => {
    try {
      await axios.post(`/api/trips/${tripId}/dispatch`);
      toast.success("Trip dispatched successfully");
      fetchTrips();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to dispatch trip");
    }
  };

  const handleCancel = async (tripId: string) => {
    try {
      await axios.post(`/api/trips/${tripId}/cancel`);
      toast.success("Trip cancelled successfully");
      fetchTrips();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to cancel trip");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: "bg-gray-100 text-gray-800",
      DISPATCHED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTabs = () => {
    const statusCounts: any = {
      DRAFT: 0,
      DISPATCHED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    trips.forEach((trip) => {
      statusCounts[trip.status]++;
    });
    return statusCounts;
  };

  const counts = getTabs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trips</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Trip
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (Cap: {v.maxLoadCapacity}kg)
                </option>
              ))}
            </select>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cargo Weight (kg)"
              value={formData.cargoWeight}
              onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Planned Distance (km)"
              value={formData.plannedDistance}
              onChange={(e) => setFormData({ ...formData, plannedDistance: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
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

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"].map((status) => (
          <button
            key={status}
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {status} ({counts[status as keyof typeof counts]})
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4" style={{
            borderLeftColor: {
              DRAFT: "#9ca3af",
              DISPATCHED: "#3b82f6",
              COMPLETED: "#10b981",
              CANCELLED: "#ef4444",
            }[trip.status] || "#9ca3af"
          }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {trip.source} → {trip.destination}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vehicle: {trip.vehicle.name} | Driver: {trip.driver.name} | Cargo: {trip.cargoWeight}kg | Distance: {trip.plannedDistance}km
                </p>
              </div>
              <div className="flex gap-2">
                {trip.status === "DRAFT" && (
                  <>
                    <button
                      onClick={() => handleDispatch(trip.id)}
                      className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      <Zap size={14} /> Dispatch
                    </button>
                    <button
                      onClick={() => handleCancel(trip.id)}
                      className="flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}
                {trip.status === "DISPATCHED" && (
                  <button
                    onClick={() => {
                      const endOdometer = prompt("Enter end odometer reading:");
                      const fuelConsumed = prompt("Enter fuel consumed (liters):");
                      const fuelCost = prompt("Enter fuel cost:");
                      const revenue = prompt("Enter revenue (optional):", "0");
                      if (endOdometer && fuelConsumed && fuelCost) {
                        axios.post(`/api/trips/${trip.id}/complete`, {
                          endOdometer: parseFloat(endOdometer),
                          fuelConsumed: parseFloat(fuelConsumed),
                          fuelCost: parseFloat(fuelCost),
                          revenue: parseFloat(revenue || "0"),
                        }).then(() => {
                          toast.success("Trip completed");
                          fetchTrips();
                        }).catch((error) => {
                          toast.error(error.response?.data?.error || "Failed to complete trip");
                        });
                      }
                    }}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
