import { api } from "@/app/api/[...remult]/api";
import CatchmentMap from "@/components/map/CatchmentMap";
import { getSchoolTypeCode } from "@/entities/School";
import { getOrCreateDataForMapByCityCodes } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { notFound } from "next/navigation";

export default async function CityMapPage(props: {
  params: Promise<{ cityCode: string; schoolType: string }>;
}) {
  const params = await props.params;

  const { cityCode, schoolType } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const numberCityCode = Number(cityCode);
  const data = await api.withRemult(
    async () =>
      await getOrCreateDataForMapByCityCodes([numberCityCode], schoolTypeCode)
  );

  if (data === null) {
    console.log("cities not found");
    notFound();
  }

  return (
    <CatchmentMap
      data={data[numberCityCode]}
      mapOptions={{
        fullHeight: true,
        showControls: true,
        pageType: "city",
        unknownAddressMessage: texts.unknownAddressMessageCity(
          data[numberCityCode].municipalities[0].municipalityName
        ),
      }}
    />
  );
}
