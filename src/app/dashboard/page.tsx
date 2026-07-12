import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Profile Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 block">Name</span>
              <span className="text-md font-medium">{user.name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Email</span>
              <span className="text-md font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Role</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Account Status</h2>
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Active Session</span>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Your account is currently active. You can manage your settings and view your activity here.
          </p>
        </div>
      </div>
      
      {user.role === 'ADMIN' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-purple-900">Admin Privileges Detected</h2>
          <p className="mt-1 text-purple-700">You have administrative access. You can visit the admin panel to manage the application.</p>
          <div className="mt-4">
            <a href="/admin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              Go to Admin Panel
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
