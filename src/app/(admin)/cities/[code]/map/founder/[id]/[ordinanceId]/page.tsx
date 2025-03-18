import { api } from "@/app/api/[...remult]/api";
import CatchmentMap from "@/components/map/CatchmentMap";
import { SchoolType } from "@/entities/School";
import {
  getOrCreateDataForMapByFounderId,
  getStreetMarkdownSourceText,
} from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function MapPage({
  params: { id, ordinanceId },
}: {
  params: { code: string; id: string; ordinanceId: string };
}) {
  const { data, smdText } = await api.withRemult(async () => {
    const data = await getOrCreateDataForMapByFounderId(
      Number(id),
      Number(ordinanceId),
      SchoolType.Elementary
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
