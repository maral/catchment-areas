import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  addOrdinanceBreadcrumb,
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function AddOrdinanceBreadcrumb({
  params: { code, from, schoolType },
}: {
  params: { code: string; from?: string[]; schoolType: string };
}) {
  const breadcrumbItems = await cityFromBreadcrumb(schoolType, from);
  const addOrdinancesBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, schoolType, from),
    addOrdinanceBreadcrumb(code, schoolType, from),
  ]);

  breadcrumbItems.push(...addOrdinancesBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
