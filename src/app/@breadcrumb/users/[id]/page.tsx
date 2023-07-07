import BreadcrumbNav from "@/components/BreadcrumbNav";
import { usersBreadcrumb, userDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function UserDetailBreadcrumb({
  params
} : {
  params: { id: string },
}) {
  const breadcrumbItems = await Promise.all([
    usersBreadcrumb,
    userDetailBreadcrumb(params.id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
