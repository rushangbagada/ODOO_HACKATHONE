import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { getSession } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TransitOps - Fleet Management",
  description: "Manage your fleet operations efficiently with TransitOps. Track vehicles, drivers, trips, and analytics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased`}>
        {!isAuthenticated && <AuthNavbar />}
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
