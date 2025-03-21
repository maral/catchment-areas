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

export enum SchoolType {
  Kindergarten = 0,
  Elementary = 1,
}

export const SchoolTypesStrings = {
  kindergarten: "kindergarten",
  elementary: "elementary",
};

export function isSchoolType(value: string): value is SchoolTypeString {
  return Object.values(SchoolTypesStrings).includes(value as SchoolTypeString);
}

export type SchoolTypeString =
  (typeof SchoolTypesStrings)[keyof typeof SchoolTypesStrings];

export const SchoolTypeValues = SchoolTypesStrings;

const SchoolTypeMapping: Record<SchoolTypeString, SchoolType> = {
  [SchoolTypesStrings.kindergarten]: SchoolType.Kindergarten,
  [SchoolTypesStrings.elementary]: SchoolType.Elementary,
};

export function getSchoolTypeCode(schoolType: string): SchoolType {
  return SchoolTypeMapping[schoolType];
}
