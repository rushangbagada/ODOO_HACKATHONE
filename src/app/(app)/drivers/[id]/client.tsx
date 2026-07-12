"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, AlertCircle } from "lucide-react";

export default function DriverDetailClient({ driverId }: { driverId: string }) {
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchUser();
    fetchDriver();
  }, [driverId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchDriver = async () => {
    try {
      const response = await axios.get(`/api/drivers/${driverId}`);
      setDriver(response.data.driver);
      setFormData(response.data.driver);
    } catch (error) {
      toast.error("Failed to load driver");
      router.push("/drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/drivers/${driverId}`, {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        licenseCategory: formData.licenseCategory,
        licenseExpiryDate: formData.licenseExpiryDate,
        contactNumber: formData.contactNumber,
        safetyScore: parseInt(formData.safetyScore),
        region: formData.region,
        status: formData.status,
      });
      toast.success("Driver updated successfully");
      setEditing(false);
      fetchDriver();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update driver");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!driver) {
    return <div className="text-center py-8 text-red-600">Driver not found</div>;
  }

  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    ON_TRIP: "bg-blue-100 text-blue-800",
    OFF_DUTY: "bg-yellow-100 text-yellow-800",
    SUSPENDED: "bg-red-100 text-red-800",
  };

  const licenseExpired = new Date(driver.licenseExpiryDate) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/drivers")}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {driver.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{driver.licenseNumber}</p>
          </div>
        </div>
        {user?.role === "FLEET_MANAGER" || user?.role === "SAFETY_OFFICER" ? (
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

      {licenseExpired && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">License Expired</p>
            <p className="text-sm text-red-800 dark:text-red-200">
              Driver's license expired on {new Date(driver.licenseExpiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

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
                License Number
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Category
              </label>
              <input
                type="text"
                value={formData.licenseCategory}
                onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Expiry Date
              </label>
              <input
                type="date"
                value={formData.licenseExpiryDate?.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Safety Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.safetyScore}
                onChange={(e) => setFormData({ ...formData, safetyScore: e.target.value })}
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
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended</option>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">License Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {driver.licenseNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Category</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {driver.licenseCategory}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Expiry Date</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(driver.licenseExpiryDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contact Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {driver.contactNumber}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[driver.status as keyof typeof statusColors]
                }`}
              >
                {driver.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Safety Score</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {driver.safetyScore}/100
                </p>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      driver.safetyScore >= 80
                        ? "bg-green-500"
                        : driver.safetyScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${driver.safetyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Region</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {driver.region}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(driver.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {driver.trips && driver.trips.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Trips ({driver.trips.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Vehicle</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Route</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {driver.trips.slice(0, 5).map((trip: any) => (
                  <tr key={trip.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{trip.vehicle?.name || "N/A"}</td>
                    <td className="px-4 py-2">{trip.source} → {trip.destination}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(trip.createdAt).toLocaleDateString()}</td>
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
