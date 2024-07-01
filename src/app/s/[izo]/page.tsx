import CatchmentMap from "@/components/map/CatchmentMap";
import {
  getOrCreateDataForMapByCityCodes,
  getOrCreateDataForMapBySchoolIzo,
} from "@/utils/server/textToMap";
import { notFound } from "next/navigation";

export default async function CityMapPage({
  params: { izo },
}: {
  params: { izo: string };
}) {
  const data = await getOrCreateDataForMapBySchoolIzo(izo);

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
