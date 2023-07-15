import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  editOrdinanceBreadcrumb,
  founderDetailBreadcrumb,
  foundersBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function EditOrdinanceBreadcrumb({
  params: { id, ordinanceId },
}: {
  params: { id: string; ordinanceId: string };
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(id),
    editOrdinanceBreadcrumb(ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
