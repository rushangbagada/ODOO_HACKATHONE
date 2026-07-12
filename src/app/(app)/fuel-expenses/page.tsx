"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";

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

  if (loading) return <LoadingPage />;

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpenseCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fuel & Expenses</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("fuel")}
          className={`px-5 py-3 font-semibold border-b-2 transition-all ${
            activeTab === "fuel"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          Fuel Logs ({fuelLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-5 py-3 font-semibold border-b-2 transition-all ${
            activeTab === "expenses"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* Fuel Logs Tab */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Fuel Cost</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalFuelCost.toFixed(2)}</p>
            </div>
            {user?.role === "FLEET_MANAGER" || user?.role === "DRIVER" || user?.role === "FINANCIAL_ANALYST" ? (
              <button
                onClick={() => setShowFuelForm(!showFuelForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Fuel Log
              </button>
            ) : (
              <div className="text-sm text-gray-500">View only</div>
            )}
          </div>

          {showFuelForm && (
            <form onSubmit={handleFuelSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={fuelFormData.vehicleId}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, vehicleId: e.target.value })}
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
                  type="number"
                  step="0.01"
                  placeholder="Liters"
                  value={fuelFormData.liters}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, liters: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  value={fuelFormData.cost}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, cost: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-all shadow-md font-medium">
                  Save
                </button>
                <button type="button" onClick={() => setShowFuelForm(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Liters</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{log.vehicle.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.liters}L</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">₹{log.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(log.date).toLocaleDateString()}</td>
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalExpenseCost.toFixed(2)}</p>
            </div>
            {user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST" ? (
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Expense
              </button>
            ) : (
              <div className="text-sm text-gray-500">View only</div>
            )}
          </div>

          {showExpenseForm && (
            <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={expenseFormData.vehicleId}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, vehicleId: e.target.value })}
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
                <select
                  value={expenseFormData.type}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, type: e.target.value as any })}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-all shadow-md font-medium">
                  Save
                </button>
                <button type="button" onClick={() => setShowExpenseForm(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{exp.vehicle.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{exp.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">₹{exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{exp.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
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
