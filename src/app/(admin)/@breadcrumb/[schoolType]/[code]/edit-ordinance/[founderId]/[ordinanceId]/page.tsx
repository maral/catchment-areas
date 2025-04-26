import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import {
  cityDetailBreadcrumb,
  editOrdinanceBreadcrumb,
  schoolTypeBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function EditOrdinanceBreadcrumb(
  props: {
    params: Promise<{
      schoolType: string;
      code: string;
      founderId: string;
      ordinanceId: string;
    }>;
  }
) {
  const params = await props.params;

  const {
    schoolType,
    code,
    founderId,
    ordinanceId
  } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  return (
    <BreadcrumbNav
      items={await Promise.all([
        schoolTypeBreadcrumb(schoolTypeCode),
        cityDetailBreadcrumb(code, schoolTypeCode),
        editOrdinanceBreadcrumb(
          Number(code),
          Number(founderId),
          Number(ordinanceId),
          schoolTypeCode
        ),
      ])}
    />
  );
}
