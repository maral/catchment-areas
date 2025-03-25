import { Entity, Fields } from "remult";
import { routes } from "@/utils/shared/constants";
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

export enum SchoolType {
  Kindergarten = 0,
  Elementary = 1,
}

export const isSchoolType = (value: string): boolean =>
  Object.keys(SchoolType)
    .map((key) => key.toLowerCase())
    .includes(value.toLowerCase());

export const getSchoolTypeCode = (schoolType: string): SchoolType =>
  SchoolType[schoolType as keyof typeof SchoolType] ?? SchoolType.Elementary;

export const getRootPathBySchoolType = (schoolType: SchoolType): string =>
  schoolType === SchoolType.Kindergarten
    ? routes.kindergarten
    : routes.elementary;
