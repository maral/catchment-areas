import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  addAnalyticsDataBreadcrumb,
  analyticsBreadcrumb,
} from "@/utils/breadcrumbItems";

export default function AnalyticsBreadcrumb() {
  const breadcrumbItems = [analyticsBreadcrumb, addAnalyticsDataBreadcrumb];

  return <BreadcrumbNav items={breadcrumbItems} />;
}
