import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityDetailBreadcrumb,
  citiesBreadcrumb,
  mapBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function MapBreadcrumb({
  params,
}: {
  params: { code: string; ordinanceId: string };
}) {
  const breadcrumbItems = await Promise.all([
    citiesBreadcrumb,
    cityDetailBreadcrumb(params.code),
    mapBreadcrumb(params.code, params.ordinanceId),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
