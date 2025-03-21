import { api } from "@/app/api/[...remult]/api";
import CatchmentMap from "@/components/map/CatchmentMap";
import { getSchoolTypeCode } from "@/entities/School";
import {
  getOrCreateDataForMapByFounderId,
  getStreetMarkdownSourceText,
} from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function MapPage({
  params: { id, ordinanceId, schoolType },
}: {
  params: { code: string; id: string; ordinanceId: string; schoolType: string };
}) {
  const { data, smdText } = await api.withRemult(async () => {
    const schoolTypeCode = getSchoolTypeCode(schoolType);

    const data = await getOrCreateDataForMapByFounderId(
      Number(id),
      Number(ordinanceId),
      schoolTypeCode
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
