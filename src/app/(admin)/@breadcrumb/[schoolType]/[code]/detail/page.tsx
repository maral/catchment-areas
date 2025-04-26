import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import {
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function CityDetailBreadcrumb(
  props: {
    params: Promise<{ schoolType: string; code: string }>;
  }
) {
  const params = await props.params;

  const {
    schoolType,
    code
  } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  return (
    <BreadcrumbNav
      items={[
        schoolTypeBreadcrumb(schoolTypeCode),
        await cityDetailBreadcrumb(code, schoolTypeCode),
      ]}
    />
  );
}
