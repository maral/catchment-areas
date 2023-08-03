import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  founderFromBreadcrumb,
  founderDetailBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function FounderDetailBreadcrumb({
  params: { id, from },
} : {
  params: { id: string, from?: string[] },
}) {
  const breadcrumbItems = await founderFromBreadcrumb(from);

  breadcrumbItems.push(await founderDetailBreadcrumb(id, from));

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
