import { Suspense } from "react";
import VehicleDetailClient from "./client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Vehicle ${id}`,
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <VehicleDetailClient vehicleId={id} />
    </Suspense>
  );
}
