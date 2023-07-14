import BreadcrumbNav from "@/components/BreadcrumbNav";
import { foundersBreadcrumb, founderDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function FounderDetailBreadcrumb({
  params
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(params.id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
