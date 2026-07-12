"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, CheckCircle, Zap, X } from "lucide-react";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
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

  const [activeCompletionTrip, setActiveCompletionTrip] = useState<any | null>(null);
  const [completionForm, setCompletionForm] = useState({
    endOdometer: "",
    fuelConsumed: "",
    fuelCost: "",
    revenue: "0",
  });
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompletionTrip) return;

    const endOdo = parseFloat(completionForm.endOdometer);
    const fuelCons = parseFloat(completionForm.fuelConsumed);
    const fuelPrice = parseFloat(completionForm.fuelCost);
    const revVal = parseFloat(completionForm.revenue || "0");

    const startOdo = activeCompletionTrip.vehicle.odometer || 0;
    if (endOdo < startOdo) {
      toast.error(`End odometer (${endOdo}) cannot be less than current odometer (${startOdo})`);
      return;
    }

    setSubmittingCompletion(true);
    try {
      await axios.post(`/api/trips/${activeCompletionTrip.id}/complete`, {
        endOdometer: endOdo,
        fuelConsumed: fuelCons,
        fuelCost: fuelPrice,
        revenue: revVal,
      });
      toast.success("Trip completed successfully");
      setActiveCompletionTrip(null);
      fetchTrips();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to complete trip");
    } finally {
      setSubmittingCompletion(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTrips();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

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

  const canCreateTrips = user?.role === "FLEET_MANAGER" || user?.role === "DRIVER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trips</h1>
        {canCreateTrips ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Trip
          </button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Only Fleet Managers and Drivers can create trips
          </div>
        )}
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
            borderLeftColor: ({
              DRAFT: "#9ca3af",
              DISPATCHED: "#3b82f6",
              COMPLETED: "#10b981",
              CANCELLED: "#ef4444",
            } as Record<string, string>)[trip.status] || "#9ca3af"
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
                      setActiveCompletionTrip(trip);
                      setCompletionForm({
                        endOdometer: String(trip.vehicle.odometer || 0),
                        fuelConsumed: "",
                        fuelCost: "",
                        revenue: "0",
                      });
                    }}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Trip Modal */}
      {activeCompletionTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Complete Trip
              </h2>
              <button
                type="button"
                onClick={() => setActiveCompletionTrip(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
              <p className="font-semibold">{activeCompletionTrip.source} ➜ {activeCompletionTrip.destination}</p>
              <p className="text-xs mt-1">Vehicle: {activeCompletionTrip.vehicle.name} | Current Odometer: {activeCompletionTrip.vehicle.odometer} km</p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    End Odometer (km)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={completionForm.endOdometer}
                    onChange={(e) => setCompletionForm({ ...completionForm, endOdometer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder={`e.g. ${Number(activeCompletionTrip.vehicle.odometer || 0) + 100}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Fuel Consumed (L)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={completionForm.fuelConsumed}
                      onChange={(e) => setCompletionForm({ ...completionForm, fuelConsumed: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. 25"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Fuel Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={completionForm.fuelCost}
                      onChange={(e) => setCompletionForm({ ...completionForm, fuelCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. 2250"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Revenue Generated (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={completionForm.revenue}
                    onChange={(e) => setCompletionForm({ ...completionForm, revenue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-150 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setActiveCompletionTrip(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompletion}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {submittingCompletion ? "Saving..." : "Complete Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
