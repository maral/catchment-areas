import { api } from "@/app/api/[...remult]/api";
import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapBySchoolIzo } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { notFound } from "next/navigation";

export default async function CityMapPage(props: {
  params: Promise<{ izo: string }>;
}) {
  const params = await props.params;

  const { izo } = params;

  const data = await api.withRemult(async () =>
    getOrCreateDataForMapBySchoolIzo(izo)
  );

  if (data === null) {
    console.log("municipalities not found");
    notFound();
  }

  return (
    <CatchmentMap
      data={data}
      mapOptions={{
        fullHeight: true,
        showControls: true,
        pageType: "school",
        unknownAddressMessage: texts.unknownAddressMessageSchool(
          data.municipalities[0].areas[0].schools[0].name
        ),
      }}
    />
  );
}
