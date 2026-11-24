import { PageSkeleton } from "@/components/states";

// Static skeleton for the method page. The page itself is static; app/error.tsx covers its errors.
export default function Loading() {
  return <PageSkeleton label="Loading the method" />;
}
