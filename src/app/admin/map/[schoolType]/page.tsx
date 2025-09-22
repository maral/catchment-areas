import AnalyticsMap from "@/components/analyticsData/AnalyticsMap";
import { getSchoolTypeCode } from "@/entities/School";
import { getCitiesForMap } from "@/utils/server/map";
import { notFound } from "next/navigation";

export default async function MapPage(props: {
  params: Promise<{ schoolType: string }>;
}) {
  const params = await props.params;

  const { schoolType } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const cities = await getCitiesForMap(schoolTypeCode);

  if (cities === null) {
    notFound();
  }

  return <AnalyticsMap cities={cities} schoolType={schoolTypeCode} />;
}
