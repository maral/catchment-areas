import CatchmentMap from "@/components/map/CatchmentMap";
import {
  getOrCreateMunicipalitiesByFounderId,
  getStreetMarkdownSourceText,
} from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function MapPage({
  params: { id, optionalOrdinanceId },
}: {
  params: { id: string; optionalOrdinanceId?: string[] };
}) {
  const founderId = Number(id);
  const ordinanceId =
    optionalOrdinanceId && optionalOrdinanceId.length > 0
      ? Number(optionalOrdinanceId[0])
      : undefined;
  const municipalities = await getOrCreateMunicipalitiesByFounderId(
    founderId,
    ordinanceId
  );

  const smdText = await getStreetMarkdownSourceText(founderId, ordinanceId);

  if (municipalities === null || smdText === null) {
    notFound();
  }

  return <CatchmentMap municipalities={municipalities} text={smdText} />;
}
