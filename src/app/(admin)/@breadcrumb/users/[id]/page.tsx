import BreadcrumbNav from "@/components/BreadcrumbNav";
import { usersBreadcrumb, userDetailBreadcrumb } from "@/utils/breadcrumbItems";

export default async function UserDetailBreadcrumb(
  props: {
    params: Promise<{ id: string }>,
  }
) {
  const params = await props.params;

  const {
    id
  } = params;

  const breadcrumbItems = await Promise.all([
    usersBreadcrumb,
    userDetailBreadcrumb(id),
  ]);

  return (
    <BreadcrumbNav items={breadcrumbItems} />
  )
}
