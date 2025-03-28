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

  @Fields.object({ dbName: "type" })
  type = SchoolType.Elementary;
}

export const isSchoolType = (value: string): boolean =>
  Object.keys(SchoolType)
    .map((key) => key.toLowerCase())
    .includes(value.toLowerCase());

export const getSchoolTypeCode = (schoolType: string): SchoolType => {
  switch (schoolType.toLowerCase()) {
    case "kindergarten":
      return SchoolType.Kindergarten;
    case "elementary":
      return SchoolType.Elementary;
    default:
      return SchoolType.Elementary;
  }
};

export const getRootPathBySchoolType = (schoolType: SchoolType): string =>
  schoolType === SchoolType.Kindergarten
    ? routes.kindergarten
    : routes.elementary;
