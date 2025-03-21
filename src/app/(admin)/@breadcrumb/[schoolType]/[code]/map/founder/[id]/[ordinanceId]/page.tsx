import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  schoolTypeBreadcrumb,
  founderMapBreadcrumb,
  editOrdinanceBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function MapBreadcrumb({
  params: { code, id, ordinanceId, schoolType },
}: {
  params: { code: string; id: string; ordinanceId: string; schoolType: string };
}) {
  const breadcrumbItems = await Promise.all([
    schoolTypeBreadcrumb(schoolType),
    cityDetailBreadcrumb(code, schoolType),
    editOrdinanceBreadcrumb(
      Number(code),
      Number(id),
      Number(ordinanceId),
      schoolType
    ),
    founderMapBreadcrumb(code, ordinanceId, schoolType),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
