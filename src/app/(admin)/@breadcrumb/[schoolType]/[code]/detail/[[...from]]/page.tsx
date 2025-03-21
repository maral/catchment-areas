import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityFromBreadcrumb,
  cityDetailBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function CityDetailBreadcrumb({
  params: { code, from, schoolType },
}: {
  params: { code: string; from?: string[]; schoolType: string };
}) {
  const breadcrumbItems = await cityFromBreadcrumb(schoolType, from);

  breadcrumbItems.push(await cityDetailBreadcrumb(code, schoolType, from));

  return <BreadcrumbNav items={breadcrumbItems} />;
}
