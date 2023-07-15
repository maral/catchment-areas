import BreadcrumbNav from "@/components/BreadcrumbNav";
import { regionDetailBreadcrumb, regionsBreadcrumb } from "@/utils/breadcrumbItems";

export default async function UsersBreadcrumb({
  params,
}: {
  params: { code: string };
}) {
  const breadcrumbItems = await Promise.all([
    regionsBreadcrumb,
    regionDetailBreadcrumb(params.code)
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
