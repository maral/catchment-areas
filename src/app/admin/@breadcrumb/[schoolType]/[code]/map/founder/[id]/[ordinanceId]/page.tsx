import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
  founderMapBreadcrumb,
  editOrdinanceBreadcrumb,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";

export default async function MapBreadcrumb(
  props: {
    params: Promise<{ code: string; id: string; ordinanceId: string; schoolType: string }>;
  }
) {
  const params = await props.params;

  const {
    code,
    id,
    ordinanceId,
    schoolType
  } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const breadcrumbItems = await Promise.all([
    schoolTypeBreadcrumb(schoolTypeCode),
    cityDetailBreadcrumb(code, schoolTypeCode),
    editOrdinanceBreadcrumb(
      Number(code),
      Number(id),
      Number(ordinanceId),
      schoolTypeCode
    ),
    founderMapBreadcrumb(code, ordinanceId, schoolTypeCode),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
