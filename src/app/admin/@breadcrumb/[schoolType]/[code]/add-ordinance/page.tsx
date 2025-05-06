import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import {
  addOrdinanceBreadcrumb,
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function AddOrdinanceBreadcrumb(
  props: {
    params: Promise<{ schoolType: string; code: string }>;
  }
) {
  const params = await props.params;

  const {
    code,
    schoolType
  } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  return (
    <BreadcrumbNav
      items={[
        schoolTypeBreadcrumb(schoolTypeCode),
        await cityDetailBreadcrumb(code, schoolTypeCode),
        addOrdinanceBreadcrumb(code, schoolTypeCode),
      ]}
    />
  );
}
