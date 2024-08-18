import CatchmentMap from "@/components/map/CatchmentMap";
import {
  getOrCreateDataForMapByFounderId,
  getStreetMarkdownSourceText,
} from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "@/app/api/[...remult]/api";

export default async function MapPage({
  params: { id, ordinanceId },
}: {
  params: { code: string; id: string; ordinanceId: string };
}) {
  const { data, smdText } = await api.withRemult(async () => {
    const data = await getOrCreateDataForMapByFounderId(
      Number(id),
      Number(ordinanceId)
    );

    const smdText = await getStreetMarkdownSourceText(
      Number(id),
      Number(ordinanceId)
    );
    return { data, smdText };
  });

  if (data === null) {
    console.log("map data not found");
    notFound();
  }
  if (smdText === null) {
    console.log("ordinance text not found");
    notFound();
  }

  return (
    <CatchmentMap
      data={data}
      mapOptions={{
        showControls: true,
        showLayerControls: true,
        showDebugInfo: true,
      }}
    />
  );
}
