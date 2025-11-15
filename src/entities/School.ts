import { SchoolType } from "@/types/basicTypes";
import { routes } from "@/utils/shared/constants";
import { Entity, Fields } from "remult";

@Entity("schools", {
  allowApiCrud: false,
  allowApiRead: true,
  dbName: "school",
})
export class School {
  @Fields.string()
  izo = "";

  @Fields.string()
  redizo = "";

  @Fields.string()
  name = "";

  @Fields.integer()
  capacity = 0;

  @Fields.integer({ dbName: "type" })
  type = SchoolType.Elementary;
}

export const isSchoolType = (value: string): boolean =>
  Object.keys(SchoolType)
    .map((key) => key.toLowerCase())
    .includes(value.toLowerCase());

export const getSchoolTypeCode = (schoolType: string): SchoolType => {
  switch (schoolType?.toLowerCase()) {
    case "kindergarten":
    case "ms":
      return SchoolType.Kindergarten;
    case "elementary":
    case "zs":
      return SchoolType.Elementary;
    default:
      return SchoolType.Elementary;
  }
};

export const getSchoolTypeString = (schoolType: SchoolType): string => {
  return schoolType === SchoolType.Kindergarten ? "kindergarten" : "elementary";
};

export const getRootPathBySchoolType = (
  schoolType: SchoolType,
  short = false
): string =>
  schoolType === SchoolType.Kindergarten
    ? short
      ? routes.shortKindergarten
      : routes.kindergarten
    : short
    ? routes.shortElementary
    : routes.elementary;
