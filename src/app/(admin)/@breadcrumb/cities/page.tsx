import BreadcrumbNav from "@/components/BreadcrumbNav";
import { citiesBreadcrumb } from "@/utils/breadcrumbItems";

export default function CitiesBreadcrumb() {
  const breadcrumbItems = [citiesBreadcrumb];

  return <BreadcrumbNav items={breadcrumbItems} />;
}
