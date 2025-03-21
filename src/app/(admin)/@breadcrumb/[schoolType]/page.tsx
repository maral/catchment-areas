import BreadcrumbNav from "@/components/BreadcrumbNav";
import { schoolTypeBreadcrumb } from "@/utils/breadcrumbItems";

export default async function SchoolTypeBreadcrumb({
  params: { schoolType },
}: {
  params: { schoolType: string };
}) {
  let breadcrumbItems = [];
  const schoolTypeBreadcrumbs = await schoolTypeBreadcrumb(schoolType);
  breadcrumbItems.push(schoolTypeBreadcrumbs);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
