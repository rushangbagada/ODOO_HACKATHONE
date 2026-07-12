import { AuthNavbar } from "@/components/layout/auth-navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthNavbar />
      {children}
    </>
  );
}
