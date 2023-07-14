import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  editOrdinanceBreadcrumb,
  founderDetailBreadcrumb,
  foundersBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function EditOrdinanceBreadcrumb({
  params,
}: {
  params: { id: string; ordinanceId: string };
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(params.id),
    editOrdinanceBreadcrumb(params.ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
