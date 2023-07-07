import BreadcrumbNav from "@/components/BreadcrumbNav";
import { addOrdinanceBreadcrumb, founderDetailBreadcrumb, foundersBreadcrumb } from "@/utils/breadcrumbItems";


export default async function FounderDetailBreadcrumb({
  params
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(params.id),
    addOrdinanceBreadcrumb(params.id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
