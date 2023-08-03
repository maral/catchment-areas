import BreadcrumbNav from "@/components/BreadcrumbNav";
import { orpsBreadcrumb } from "@/utils/breadcrumbItems";

export default function OrpsBreadcrumb() {
  const breadcrumbItems = [
    orpsBreadcrumb,
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
