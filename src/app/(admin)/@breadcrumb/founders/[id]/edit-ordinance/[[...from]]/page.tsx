import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  editOrdinanceBreadcrumb,
  founderDetailBreadcrumb,
  founderFromBreadcrumb,
  foundersBreadcrumb,
  getOrdinanceIdFromFrom,
} from "@/utils/breadcrumbItems";

export default async function EditOrdinanceBreadcrumb({
  params: { id, from },
}: {
  params: { id: string; from?: string[] };
}) {
  const ordinanceId = getOrdinanceIdFromFrom(from);

  const breadcrumbItems = await founderFromBreadcrumb(from);
  const editOrdinanceBreadcrumbs = await Promise.all([
    founderDetailBreadcrumb(id, from),
    editOrdinanceBreadcrumb(ordinanceId),  
  ]);

  breadcrumbItems.push(...editOrdinanceBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
