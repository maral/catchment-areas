import PublicMap from "@/components/publicMap/PublicMap";
import { getCitiesForMap } from "@/utils/server/map";
import { notFound } from "next/navigation";
import { getSchoolTypeCode } from "@/entities/School";

export default async function MapPage(props: {
  params: Promise<{schoolType: string }>;
}) {

  const params = await props.params;

  const { schoolType } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const cities = await getCitiesForMap();

  if (cities === null) {
    notFound();
  }

  return <PublicMap cities={cities} schoolType={schoolTypeCode} />;
}
