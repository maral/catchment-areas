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

  /*
  // popsat, jak bude fungovat:
  - mapa
    - ordinance_id + city_code -> vyhláška celého města (v případě běžných obcí je to i jediná varianta)
    - ordinance_id + (city_code) + founder_id -> vyhláška části města (nebo celého města v případě Liberce)
  - detail (city_code)
    - v případě běžných měst jako dosud (tabulka s vyhláškami a akcemi)
    - pokud je aspoň 1 MČ, tak pod každou vyhláškou přidat rozbalovací seznam s tlačítky:
      - v záhlaví mapa celého města, smazání vyhlášky
      - u každého foundera editace vyhlášky a mapa
  - download - pouze pro celé město, jako je to dosud
*/

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
