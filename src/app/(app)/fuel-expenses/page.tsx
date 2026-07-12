"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

export default function FuelExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fuel" | "expenses">("fuel");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [fuelFormData, setFuelFormData] = useState({
    vehicleId: "",
    liters: "",
    cost: "",
  });

  const [expenseFormData, setExpenseFormData] = useState({
    vehicleId: "",
    type: "TOLL",
    amount: "",
    description: "",
  });

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/auth/verify-session");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user");
    }
  };

  const fetchData = async () => {
    try {
      const [fuelRes, expenseRes, vehicleRes] = await Promise.all([
        axios.get("/api/fuel-logs"),
        axios.get("/api/expenses"),
        axios.get("/api/vehicles"),
      ]);
      setFuelLogs(fuelRes.data.logs);
      setExpenses(expenseRes.data.expenses);
      setVehicles(vehicleRes.data.vehicles);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/fuel-logs", {
        ...fuelFormData,
        liters: parseFloat(fuelFormData.liters),
        cost: parseFloat(fuelFormData.cost),
      });
      toast.success("Fuel log created successfully");
      setShowFuelForm(false);
      setFuelFormData({ vehicleId: "", liters: "", cost: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create fuel log");
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/expenses", {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
      });
      toast.success("Expense created successfully");
      setShowExpenseForm(false);
      setExpenseFormData({ vehicleId: "", type: "TOLL", amount: "", description: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create expense");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpenseCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fuel & Expenses</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("fuel")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "fuel"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          Fuel Logs ({fuelLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "expenses"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* Fuel Logs Tab */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Fuel Cost</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalFuelCost.toFixed(2)}</p>
            </div>
            {user?.role === "FLEET_MANAGER" || user?.role === "DRIVER" || user?.role === "FINANCIAL_ANALYST" ? (
              <button
                onClick={() => setShowFuelForm(!showFuelForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                Add Fuel Log
              </button>
            ) : (
              <div className="text-sm text-gray-500">View only</div>
            )}
          </div>

          {showFuelForm && (
            <form onSubmit={handleFuelSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={fuelFormData.vehicleId}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, vehicleId: e.target.value })}
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
                  type="number"
                  step="0.01"
                  placeholder="Liters"
                  value={fuelFormData.liters}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, liters: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  value={fuelFormData.cost}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, cost: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Save
                </button>
                <button type="button" onClick={() => setShowFuelForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Vehicle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Liters</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.vehicle.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.liters}L</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{log.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{new Date(log.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalExpenseCost.toFixed(2)}</p>
            </div>
            {user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST" ? (
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                Add Expense
              </button>
            ) : (
              <div className="text-sm text-gray-500">View only</div>
            )}
          </div>

          {showExpenseForm && (
            <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={expenseFormData.vehicleId}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, vehicleId: e.target.value })}
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
                <select
                  value={expenseFormData.type}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, type: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="TOLL">Toll</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Save
                </button>
                <button type="button" onClick={() => setShowExpenseForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Vehicle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{exp.vehicle.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{exp.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{exp.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{new Date(exp.date).toLocaleDateString()}</td>
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
