import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <div className="relative isolate overflow-hidden">
      {/* Premium Background Mesh Glows */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem]-translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] opacity-20 dark:opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="py-20 sm:py-28 lg:pb-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent leading-[1.15] sm:leading-[1.15]">
              Secure Authentication for your Next.js App
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto">
              A production-ready boilerplate featuring custom JWT auth, Prisma ORM, Neon PostgreSQL, 
              Role-based access control, and Forgot Password flow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10">Get Started</Button>
                  </Link>
                  <Link href="/signin" className="text-sm font-semibold leading-6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-150 transition-colors">
                    Sign In <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="mt-16 flow-root sm:mt-24 max-w-4xl mx-auto">
            <div className="-m-2 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/40 p-2 ring-1 ring-inset ring-zinc-950/10 dark:ring-zinc-800 lg:-m-4 lg:rounded-3xl lg:p-4">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl border border-zinc-100 dark:border-zinc-800/80 p-8 sm:p-10">
                <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Core Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 border rounded-xl bg-blue-50/20 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Custom JWT Auth</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-450 leading-relaxed">Secure HTTP-only cookies, no third-party services required.</p>
                  </div>
                  <div className="p-5 border rounded-xl bg-purple-50/20 dark:bg-purple-950/10 border-purple-100/50 dark:border-purple-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2">RBAC</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-450 leading-relaxed">Role-based access control with USER and ADMIN roles.</p>
                  </div>
                  <div className="p-5 border rounded-xl bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2">Modern Stack</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-450 leading-relaxed">Next.js 14+ App Router, Prisma, Tailwind, and Zod.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Glow */}
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 bg-gradient-to-tr from-[#60a5fa] to-[#c084fc] opacity-15 dark:opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </div>
  );
}
