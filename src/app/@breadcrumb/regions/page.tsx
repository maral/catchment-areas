import BreadcrumbNav from "@/components/BreadcrumbNav";
import { regionsBreadcrumb } from "@/utils/breadcrumbItems";

export default function UsersBreadcrumb() {
  const breadcrumbItems = [
    regionsBreadcrumb
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
