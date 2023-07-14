import BreadcrumbNav from "@/components/BreadcrumbNav";
import { foundersBreadcrumb } from "@/utils/breadcrumbItems";

export default function FoundersBreadcrumb() {
  const breadcrumbItems = [
    foundersBreadcrumb
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
