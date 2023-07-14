import BreadcrumbNav from "@/components/BreadcrumbNav";
import { usersBreadcrumb } from "@/utils/breadcrumbItems";

export default function UsersBreadcrumb() {
  const breadcrumbItems = [
    usersBreadcrumb
  ];

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
