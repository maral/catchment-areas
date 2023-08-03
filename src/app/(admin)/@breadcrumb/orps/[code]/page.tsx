import BreadcrumbNav from "@/components/BreadcrumbNav";
import { orpDetailBreadcrumb, orpsBreadcrumb } from "@/utils/breadcrumbItems";

export default async function OrpDetailBreadcrumb({
  params: { code },
}: {
  params: { code: string };
}) {
  const breadcrumbItems = await Promise.all([
    orpsBreadcrumb,
    orpDetailBreadcrumb(code),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  );
}