import BreadcrumbNav from "@/components/BreadcrumbNav";
import { usersBreadcrumb, addUserBreadcrumb } from "@/utils/breadcrumbItems";

export default async function UserDetailBreadcrumb() {
  const breadcrumbItems = [
    usersBreadcrumb,
    addUserBreadcrumb,
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
