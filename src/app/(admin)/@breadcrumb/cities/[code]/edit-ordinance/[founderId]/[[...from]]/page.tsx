import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
  editOrdinanceBreadcrumb,
  getOrdinanceIdFromFrom,
} from "@/utils/breadcrumbItems";

export default async function EditOrdinanceBreadcrumb({
  params: { code, founderId, from },
}: {
  params: { code: string; founderId: string; from?: string[] };
}) {
  const ordinanceId = getOrdinanceIdFromFrom(from);

  const breadcrumbItems = await cityFromBreadcrumb(from);
  const editOrdinanceBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, from),
    editOrdinanceBreadcrumb(
      Number(code),
      Number(founderId),
      Number(ordinanceId)
    ),
  ]);

  breadcrumbItems.push(...editOrdinanceBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
