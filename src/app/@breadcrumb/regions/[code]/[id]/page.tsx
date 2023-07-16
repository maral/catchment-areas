import BreadcrumbNav from "@/components/BreadcrumbNav";
import { regionDetailBreadcrumb, regionFounderDetailBreadcrumb, regionsBreadcrumb } from "@/utils/breadcrumbItems";

export default async function RegionFounderDetailBreadcrumb({
  params: { code, id },
}: {
  params: { code: string, id: string };
}) {
  const breadcrumbItems = await Promise.all([
    regionsBreadcrumb,
    regionDetailBreadcrumb(code),
    regionFounderDetailBreadcrumb({
      regionCode: code,
      founderId: id,
    }),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
