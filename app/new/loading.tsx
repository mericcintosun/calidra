import { PageSkeleton } from "@/components/states";

// Static skeleton for the create flow. No animation.
export default function Loading() {
  return <PageSkeleton label="Loading the site form" />;
}
