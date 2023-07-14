import BreadcrumbNav from "@/components/BreadcrumbNav";
import { BreadcrumbItem } from "@/utils/breadcrumbItems";

export default function DefaultBreadcrumb() {
  const breadcrumbItems = [] as BreadcrumbItem[];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
