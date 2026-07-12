import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { getSession } from "@/lib/auth";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {!isAuthenticated && <AuthNavbar />}
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
