import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (e) {
    user = null;
  }

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Topbar user={user} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
