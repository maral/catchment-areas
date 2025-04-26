import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapByCityCode } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "../../../../../api/[...remult]/api";
import { getSchoolTypeCode } from "@/entities/School";

export default async function MapPage(
  props: {
    params: Promise<{ code: string; ordinanceId: string; schoolType: string }>;
  }
) {
  const params = await props.params;

  const {
    code,
    ordinanceId,
    schoolType
  } = params;

  const cityCode = Number(code);

  const data = await api.withRemult(async () =>
    getOrCreateDataForMapByCityCode(
      cityCode,
      Number(ordinanceId),
      getSchoolTypeCode(schoolType)
    )
  );

  if (data === null) {
    console.log("municipalities not found");
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
