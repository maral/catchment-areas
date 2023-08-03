import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  founderDetailBreadcrumb,
  foundersBreadcrumb,
  mapBreadcrumb,
} from "@/utils/breadcrumbItems";

export default async function MapBreadcrumb({
  params,
}: {
  params: { id: string; optionalOrdinanceId?: string[] };
}) {
  const breadcrumbItems = await Promise.all([
    foundersBreadcrumb,
    founderDetailBreadcrumb(params.id),
    mapBreadcrumb(
      params.id,
      params.optionalOrdinanceId
        ? params.optionalOrdinanceId[0] ?? undefined
        : undefined
    ),
  ]);

  return <BreadcrumbNav items={breadcrumbItems} />;
}
