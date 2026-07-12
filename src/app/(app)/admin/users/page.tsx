"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle, X, Clock } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});
  const [counts, setCounts] = useState<{ PENDING: number; APPROVED: number; REJECTED: number }>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/users?status=${activeTab}`);
      setUsers(response.data.users);
      if (response.data.counts) {
        setCounts(response.data.counts);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId: string) => {
    try {
      await axios.post(`/api/admin/users/${userId}/approve`);
      toast.success("User approved!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to approve user");
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectReason[userId];
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await axios.post(`/api/admin/users/${userId}/reject`, { reason });
      toast.success("User rejected!");
      setRejectReason({ ...rejectReason, [userId]: "" });
      setShowRejectForm({ ...showRejectForm, [userId]: false });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject user");
    }
  };

  const roleColors = {
    FLEET_MANAGER: "bg-blue-100 text-blue-800",
    DRIVER: "bg-green-100 text-green-800",
    SAFETY_OFFICER: "bg-purple-100 text-purple-800",
    FINANCIAL_ANALYST: "bg-orange-100 text-orange-800",
  };

  const statusIcons = {
    PENDING: <Clock className="text-yellow-500" size={20} />,
    APPROVED: <CheckCircle className="text-green-500" size={20} />,
    REJECTED: <X className="text-red-500" size={20} />,
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {["PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            {tab} ({counts[tab as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
              {activeTab === "PENDING" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No {activeTab.toLowerCase()} users
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}>
                      {user.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {statusIcons[user.status as keyof typeof statusIcons]}
                      <span>{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  {activeTab === "PENDING" && (
                    <td className="px-6 py-4 text-sm space-y-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="block w-full bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectForm({ ...showRejectForm, [user.id]: !showRejectForm[user.id] })}
                        className="block w-full bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      >
                        Reject
                      </button>

                      {showRejectForm[user.id] && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <textarea
                            placeholder="Rejection reason..."
                            value={rejectReason[user.id] || ""}
                            onChange={(e) => setRejectReason({ ...rejectReason, [user.id]: e.target.value })}
                            className="w-full text-xs p-2 border rounded dark:bg-gray-600 dark:text-white"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleReject(user.id)}
                              className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setShowRejectForm({ ...showRejectForm, [user.id]: false })}
                              className="flex-1 bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
