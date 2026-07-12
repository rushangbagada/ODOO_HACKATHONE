import { Suspense } from "react";
import DriverDetailClient from "./client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Driver ${id}`,
  };
}

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <DriverDetailClient driverId={id} />
    </Suspense>
  );
}
