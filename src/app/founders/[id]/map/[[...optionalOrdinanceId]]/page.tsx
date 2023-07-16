import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateMunicipalities } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function MapPage({
  params: { id, optionalOrdinanceId },
}: {
  params: { id: string; optionalOrdinanceId: string[] };
}) {
  const municipalities = await getOrCreateMunicipalities(
    Number(id),
    optionalOrdinanceId.length > 0 ? Number(optionalOrdinanceId[0]) : undefined
  );

  if (municipalities === null) {
    notFound();
  }

  return <CatchmentMap municipalities={municipalities} />;
}
