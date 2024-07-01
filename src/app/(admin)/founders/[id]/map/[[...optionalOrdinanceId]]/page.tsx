import CatchmentMap from "@/components/map/CatchmentMap";
import {
  getOrCreateDataForMapByFounderId,
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
  const data = await getOrCreateDataForMapByFounderId(founderId, ordinanceId);

  const smdText = await getStreetMarkdownSourceText(founderId, ordinanceId);

  if (data === null) {
    console.log("municipalities not found");
    notFound();
  }
  if (smdText === null) {
    console.log("ordinance text not found");
    notFound();
  }

  return (
    <CatchmentMap
      data={data}
      text={smdText}
      mapOptions={{
        showControls: true,
        showLayerControls: true,
        showDebugInfo: true,
      }}
    />
  );
}
