import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  citiesBreadcrumb,
  schoolTypeBreadcrumb,
  mapBreadcrumb,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";
export default async function MapBreadcrumb({
  params: { code, ordinanceId, schoolType },
}: {
  params: { code: string; ordinanceId: string; schoolType: string };
}) {
  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const breadcrumbItems = await Promise.all([
    schoolTypeBreadcrumb(schoolTypeCode),
    cityDetailBreadcrumb(code, schoolTypeCode),
    mapBreadcrumb(code, ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
