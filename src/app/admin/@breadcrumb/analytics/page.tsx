import BreadcrumbNav from "@/components/BreadcrumbNav";
import { analyticsBreadcrumb } from "@/utils/breadcrumbItems";

export default function AnalyticsBreadcrumb() {
  const breadcrumbItems = [analyticsBreadcrumb];

  return <BreadcrumbNav items={breadcrumbItems} />;
}
