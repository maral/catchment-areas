import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapByCityCode } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "../../../../../api/[...remult]/api";

export default async function MapPage({
  params: { code, ordinanceId },
}: {
  params: { code: string; ordinanceId: string };
}) {
  const cityCode = Number(code);

  const data = await api.withRemult(async () =>
    getOrCreateDataForMapByCityCode(cityCode, Number(ordinanceId))
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
