import BreadcrumbNav from "@/components/BreadcrumbNav";
import {
  cityFromBreadcrumb,
  cityDetailBreadcrumb,
} from "@/utils/breadcrumbItems";
import { getSchoolTypeCode } from "@/entities/School";

export default async function CityDetailBreadcrumb({
  params: { code, from, schoolType },
}: {
  params: { code: string; from?: string[]; schoolType: string };
}) {
  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const breadcrumbItems = await cityFromBreadcrumb(schoolTypeCode, from);

  breadcrumbItems.push(await cityDetailBreadcrumb(code, schoolTypeCode, from));

  return <BreadcrumbNav items={breadcrumbItems} />;
}
