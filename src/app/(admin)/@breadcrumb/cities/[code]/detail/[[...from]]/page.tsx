import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityFromBreadcrumb,
  cityDetailBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function CityDetailBreadcrumb({
  params: { code, from },
}: {
  params: { code: string; from?: string[] };
}) {
  const breadcrumbItems = await cityFromBreadcrumb(from);

  breadcrumbItems.push(await cityDetailBreadcrumb(code, from));

  return <BreadcrumbNav items={breadcrumbItems} />;
}
