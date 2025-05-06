// app/[schoolType]/layout.tsx
import { notFound } from "next/navigation";
import { isSchoolType } from "@/entities/School";

export default async function SchoolTypeLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ schoolType: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  // Check if the school type is valid and if not, return a 404 page
  if (!isSchoolType(params.schoolType)) {
    notFound();
  }

  return <>{children}</>;
}
