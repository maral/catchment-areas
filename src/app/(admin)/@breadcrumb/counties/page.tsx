import BreadcrumbNav from "@/components/BreadcrumbNav";
import { countiesBreadcrumb } from "@/utils/breadcrumbItems";

export default function CountiesBreadcrumb() {
  const breadcrumbItems = [
    countiesBreadcrumb,
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
