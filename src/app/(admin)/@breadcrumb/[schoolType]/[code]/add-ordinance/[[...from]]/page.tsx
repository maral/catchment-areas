import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  addOrdinanceBreadcrumb,
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";

export default async function AddOrdinanceBreadcrumb({
  params: { code, from, schoolType },
}: {
  params: { code: string; from?: string[]; schoolType: string };
}) {
  const schoolTypeCode = await getSchoolTypeCode(schoolType);
  const breadcrumbItems = await cityFromBreadcrumb(schoolTypeCode, from);
  const addOrdinancesBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, schoolTypeCode, from),
    addOrdinanceBreadcrumb(code, schoolTypeCode, from),
  ]);

  breadcrumbItems.push(...addOrdinancesBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
