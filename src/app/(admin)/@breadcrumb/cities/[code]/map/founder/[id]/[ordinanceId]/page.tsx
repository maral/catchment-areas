import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  citiesBreadcrumb,
  founderMapBreadcrumb,
  editOrdinanceBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function MapBreadcrumb({
  params,
}: {
  params: { code: string; id: string; ordinanceId: string };
}) {
  const breadcrumbItems = await Promise.all([
    citiesBreadcrumb,
    cityDetailBreadcrumb(params.code),
    editOrdinanceBreadcrumb(
      Number(params.code),
      Number(params.id),
      Number(params.ordinanceId)
    ),
    founderMapBreadcrumb(params.code, params.ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
