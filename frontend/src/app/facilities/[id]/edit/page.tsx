import EditFacilityClient from "./EditFacilityClient";

export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export default function EditFacilityPage() {
  return <EditFacilityClient />;
}
