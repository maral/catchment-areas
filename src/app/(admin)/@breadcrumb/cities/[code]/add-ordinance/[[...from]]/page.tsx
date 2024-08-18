import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  addOrdinanceBreadcrumb,
  cityDetailBreadcrumb,
  cityFromBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function AddOrdinanceBreadcrumb({
  params: { code, from },
}: {
  params: { code: string; from?: string[] };
}) {
  const breadcrumbItems = await cityFromBreadcrumb(from);
  const addOrdinancesBreadcrumbs = await Promise.all([
    cityDetailBreadcrumb(code, from),
    addOrdinanceBreadcrumb(code, from),
  ]);

  breadcrumbItems.push(...addOrdinancesBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
