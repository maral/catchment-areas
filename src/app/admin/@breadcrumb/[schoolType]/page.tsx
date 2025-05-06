import BreadcrumbNav from "@/components/BreadcrumbNav";
import { getSchoolTypeCode } from "@/entities/School";
import { schoolTypeBreadcrumb } from "@/utils/breadcrumbItems";

export default async function SchoolTypeBreadcrumb(props: {
  params: Promise<{ schoolType: string }>;
}) {
  const params = await props.params;
  const { schoolType } = params;

  return (
    <BreadcrumbNav
      items={[schoolTypeBreadcrumb(getSchoolTypeCode(schoolType))]}
    />
  );
}
