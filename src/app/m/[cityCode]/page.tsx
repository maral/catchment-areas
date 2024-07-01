import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapByCityCodes } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function CityMapPage({
  params: { cityCode },
}: {
  params: { cityCode: string };
}) {
  const numberCityCode = Number(cityCode);
  const data = await getOrCreateDataForMapByCityCodes([numberCityCode]);

  if (data === null) {
    console.log("cities not found");
    notFound();
  }

  return (
    <CatchmentMap
      data={data[numberCityCode]}
      mapOptions={{ fullHeight: true, showControls: true, pageType: "city" }}
    />
  );
}
