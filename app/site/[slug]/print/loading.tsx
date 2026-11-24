import { PageSkeleton } from "@/components/states";

// Static skeleton while the crew sheet's hours and QR code are prepared.
export default function Loading() {
  return <PageSkeleton label="Preparing the crew sheet" />;
}
