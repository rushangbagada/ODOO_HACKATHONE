"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, CheckCircle } from "lucide-react";

export default function MaintenancePage() {
  const [logs, setLogs] = useState<any[]>([]);
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
    fetchLogs();
    fetchVehicles();
  }, []);

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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maintenance</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Maintenance Log
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Cost"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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

      <div className="grid gap-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {log.vehicle.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <strong>Type:</strong> {log.type}
                </p>
                {log.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Description:</strong> {log.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Cost:</strong> ₹{log.cost} | <strong>Start:</strong> {new Date(log.startDate).toLocaleDateString()}
                </p>
              </div>
              {log.status === "ACTIVE" && (
                <button
                  onClick={() => handleClose(log.id)}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
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
