import BreadcrumbNav from "@/components/BreadcrumbNav";
import { addOrdinanceBreadcrumb, founderDetailBreadcrumb, foundersBreadcrumb } from "@/utils/breadcrumbItems";


export default async function AddOrdinanceBreadcrumb({
  params: { id }
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(id),
    addOrdinanceBreadcrumb(id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
