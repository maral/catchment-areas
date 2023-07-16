import BreadcrumbNav from "@/components/BreadcrumbNav";
import { addOrdinanceBreadcrumb, founderDetailBreadcrumb, founderFromBreadcrumb, foundersBreadcrumb } from "@/utils/breadcrumbItems";


export default async function AddOrdinanceBreadcrumb({
  params: { id, from }
} : {
  params: { id: string, from?: string[] },
}) {
  const breadcrumbItems = await founderFromBreadcrumb(from);
  const addOrdinancesBreadcrumbs = await Promise.all([
    founderDetailBreadcrumb(id, from),
    addOrdinanceBreadcrumb(id, from)
  ])
  
  breadcrumbItems.push(...addOrdinancesBreadcrumbs);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
