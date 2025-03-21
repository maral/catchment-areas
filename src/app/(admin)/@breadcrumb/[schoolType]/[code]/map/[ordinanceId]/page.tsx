import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  citiesBreadcrumb,
  schoolTypeBreadcrumb,
  mapBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function MapBreadcrumb({
  params: { code, ordinanceId, schoolType },
}: {
  params: { code: string; ordinanceId: string; schoolType: string };
}) {
  const breadcrumbItems = await Promise.all([
    schoolTypeBreadcrumb(schoolType),
    cityDetailBreadcrumb(code, schoolType),
    mapBreadcrumb(code, ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
