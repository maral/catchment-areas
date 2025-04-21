import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import {
  addOrdinanceBreadcrumb,
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function AddOrdinanceBreadcrumb({
  params: { code, schoolType },
}: {
  params: { schoolType: string; code: string };
}) {
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
