import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import {
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function CityDetailBreadcrumb({
  params: { schoolType, code },
}: {
  params: { schoolType: string; code: string };
}) {
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
