import { PageSkeleton } from "@/components/states";

// Static skeleton for the collection. No animation.
export default function Loading() {
  return <PageSkeleton label="Loading crew sites" />;
}
