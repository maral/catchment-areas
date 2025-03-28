import CatchmentMap from "@/components/map/CatchmentMap";
import { SchoolType } from "@/entities/School";
import { getOrCreateDataForMapByCityCodes } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "../../api/[...remult]/api";

export default async function CityMapPage({
  params: { cityCode },
}: {
  params: { cityCode: string };
}) {
  const numberCityCode = Number(cityCode);
  const data = await api.withRemult(
    async () =>
      await getOrCreateDataForMapByCityCodes(
        [numberCityCode],
        SchoolType.Elementary
      )
  );

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
