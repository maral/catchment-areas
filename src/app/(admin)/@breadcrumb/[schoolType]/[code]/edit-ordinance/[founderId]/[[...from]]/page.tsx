import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
  editOrdinanceBreadcrumb,
  getOrdinanceIdFromFrom,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";

export default async function EditOrdinanceBreadcrumb({
  params: { code, founderId, from, schoolType },
}: {
  params: {
    code: string;
    founderId: string;
    from?: string[];
    schoolType: string;
  };
}) {
  const ordinanceId = getOrdinanceIdFromFrom(from);

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const breadcrumbItems = await cityFromBreadcrumb(schoolTypeCode, from);
  const editOrdinanceBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, schoolTypeCode, from),
    editOrdinanceBreadcrumb(
      Number(code),
      Number(founderId),
      Number(ordinanceId),
      schoolTypeCode
    ),
  ]);

  breadcrumbItems.push(...editOrdinanceBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
