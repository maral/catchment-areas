import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapByCityCode } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "../../../../../api/[...remult]/api";
import { getSchoolTypeCode } from "@/entities/School";

export default async function MapPage({
  params: { code, ordinanceId, schoolType },
}: {
  params: { code: string; ordinanceId: string; schoolType: string };
}) {
  const cityCode = Number(code);

  const data = await api.withRemult(async () =>
    getOrCreateDataForMapByCityCode(
      cityCode,
      Number(ordinanceId),
      getSchoolTypeCode(schoolType)
    )
  );

  console.log(data);

  if (data === null) {
    console.log("municipalities not found");
    notFound();
  }

  console.log("rendering map page");

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
