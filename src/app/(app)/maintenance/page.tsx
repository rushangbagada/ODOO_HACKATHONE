"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, CheckCircle } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

export default function MaintenancePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vehicleId: "",
    type: "",
    description: "",
    cost: "",
  });

  useEffect(() => {
    fetchUser();
    fetchLogs();
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

  const fetchLogs = async () => {
    try {
      const response = await axios.get("/api/maintenance");
      setLogs(response.data.logs);
    } catch (error) {
      toast.error("Failed to load maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("/api/vehicles");
      setVehicles(response.data.vehicles.filter((v: any) => v.status !== "RETIRED"));
    } catch (error) {
      console.error("Failed to load vehicles");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/maintenance", {
        ...formData,
        cost: parseFloat(formData.cost),
      });
      toast.success("Maintenance log created successfully");
      setShowForm(false);
      setFormData({ vehicleId: "", type: "", description: "", cost: "" });
      fetchLogs();
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create maintenance log");
    }
  };

  const handleClose = async (logId: string) => {
    try {
      await axios.post(`/api/maintenance/${logId}/close`);
      toast.success("Maintenance log closed successfully");
      fetchLogs();
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to close maintenance log");
    }
  };

  if (loading) return <LoadingPage />;

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maintenance</h1>
        {user?.role === "FLEET_MANAGER" ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            New Maintenance Log
          </button>
        ) : (
          <div className="text-sm text-gray-500">View only</div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Maintenance Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <input
              type="number"
              placeholder="Cost"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-all shadow-md font-medium">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {log.vehicle.name}
                  </h3>
                  <Badge variant={log.status === "ACTIVE" ? "info" : "default"}>
                    {log.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-medium">Type:</span> {log.type}
                </p>
                {log.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-medium">Description:</span> {log.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Cost:</span> ₹{log.cost} | <span className="font-medium">Start:</span> {new Date(log.startDate).toLocaleDateString()}
                </p>
              </div>
              {log.status === "ACTIVE" && (
                <button
                  onClick={() => handleClose(log.id)}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700 transition-all shadow-sm font-medium"
                >
                  <CheckCircle size={14} /> Close
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
