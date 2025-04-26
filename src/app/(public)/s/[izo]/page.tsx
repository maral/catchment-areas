import CatchmentMap from "@/components/map/CatchmentMap";
import { getOrCreateDataForMapBySchoolIzo } from "@/utils/server/textToMap";
import { notFound } from "next/navigation";
import { api } from "../../api/[...remult]/api";

export default async function CityMapPage(
  props: {
    params: Promise<{ izo: string }>;
  }
) {
  const params = await props.params;

  const {
    izo
  } = params;

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
      mapOptions={{ fullHeight: true, showControls: true, pageType: "school" }}
    />
  );
}
