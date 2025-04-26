import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
  mapBreadcrumb,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";
export default async function MapBreadcrumb(
  props: {
    params: Promise<{ code: string; ordinanceId: string; schoolType: string }>;
  }
) {
  const params = await props.params;

  const {
    code,
    ordinanceId,
    schoolType
  } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const breadcrumbItems = await Promise.all([
    schoolTypeBreadcrumb(schoolTypeCode),
    cityDetailBreadcrumb(code, schoolTypeCode),
    mapBreadcrumb(code, ordinanceId, schoolTypeCode),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
