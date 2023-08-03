import BreadcrumbNav from "@/components/BreadcrumbNav";
import { regionsBreadcrumb } from "@/utils/breadcrumbItems";

export default function RegionsBreadcrumb() {
  const breadcrumbItems = [
    regionsBreadcrumb,
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
