import BreadcrumbNav from "@/components/BreadcrumbNav";
import { countiesBreadcrumb, countyDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function CountyDetailBreadcrumb({
  params: { code },
}: {
  params: { code: string };
}) {
  const breadcrumbItems = await Promise.all([
    countiesBreadcrumb,
    countyDetailBreadcrumb(code)
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
