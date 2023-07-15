import BreadcrumbNav from "@/components/BreadcrumbNav";
import { regionDetailBreadcrumb, regionsBreadcrumb } from "@/utils/breadcrumbItems";

export default async function RegionDetailBreadcrumb({
  params: { code },
}: {
  params: { code: string };
}) {
  const breadcrumbItems = await Promise.all([
    regionsBreadcrumb,
    regionDetailBreadcrumb(code),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
