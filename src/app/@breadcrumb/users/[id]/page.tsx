import BreadcrumbNav from "@/components/BreadcrumbNav";
import { usersBreadcrumb, userDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function UserDetailBreadcrumb({
  params: { id },
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    usersBreadcrumb,
    userDetailBreadcrumb(id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
