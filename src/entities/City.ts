import { Region } from "@/entities/Region";
import { SchoolType } from "@/types/basicTypes";
import { Entity, Field, Fields } from "remult";

@Entity("cities", {
  allowApiCrud: true,
  dbName: "city",
})
export class City {
  @Fields.autoIncrement()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { dbName: "region_code" })
  region!: Region;

  @Fields.number({ dbName: "wgs84_latitude" })
  latitude = 0.0;

  @Fields.number({ dbName: "wgs84_longitude" })
  longitude = 0.0;

  @Fields.integer({ dbName: "school_count" })
  schoolCount = 0;

  @Fields.integer({ dbName: "kindergarten_count" })
  kindergartenCount = 0;

  @Fields.integer({ dbName: "status_elementary" })
  statusElementary = 0;

  @Fields.integer({ dbName: "status_kindergarten" })
  statusKindergarten = 0;
}

export enum CityStatus {
  NoOrdinance,
  NoExistingOrdinance,
  InProgress,
  Published,
}

export function getStatusColumnBySchoolType(schoolType: SchoolType) {
  return schoolType === SchoolType.Elementary
    ? "status_elementary"
    : "status_kindergarten";
}

export function getStatusPropertyBySchoolType(schoolType: SchoolType) {
  switch (schoolType) {
    case SchoolType.Elementary:
      return "statusElementary";
    case SchoolType.Kindergarten:
      return "statusKindergarten";
  }
}

export function getCountPropertyBySchoolType(schoolType: SchoolType) {
  switch (schoolType) {
    case SchoolType.Elementary:
      return "schoolCount";
    case SchoolType.Kindergarten:
      return "kindergartenCount";
  }
}
