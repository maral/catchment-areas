import BreadcrumbNav from "@/components/BreadcrumbNav";
import { foundersBreadcrumb, founderDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function FounderDetailBreadcrumb({
  params: { id },
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
