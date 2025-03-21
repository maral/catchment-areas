import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
  editOrdinanceBreadcrumb,
  getOrdinanceIdFromFrom,
} from "@/utils/breadcrumbItems";

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

  const breadcrumbItems = await cityFromBreadcrumb(schoolType, from);
  const editOrdinanceBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, schoolType, from),
    editOrdinanceBreadcrumb(
      Number(code),
      Number(founderId),
      Number(ordinanceId),
      schoolType
    ),
  ]);

  breadcrumbItems.push(...editOrdinanceBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
