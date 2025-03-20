// app/[schoolType]/layout.tsx
import { notFound } from "next/navigation";
import { isSchoolType } from "@/types/schoolTypes";

export default function SchoolTypeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { schoolType: string };
}) {
  // Check if the school type is valid and if not, return a 404 page
  if (!isSchoolType(params.schoolType)) {
    notFound();
  }

  return <>{children}</>;
}
