import { Region } from "@/entities/Region";
import { Entity, Field, Fields } from "remult";
import { County } from "./County";
import { Orp } from "./Orp";

@Entity("cities", {
  allowApiCrud: true,
  dbName: "city",
  backendPrefilter: () => ({
    schoolCount: { $gt: 1 },
  }),
})
export class City {
  @Fields.autoIncrement()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { dbName: "region_code" })
  region!: Region;

  @Field(() => County, { dbName: "county_code" })
  county!: County;

  @Field(() => Orp, { dbName: "orp_code" })
  orp!: Orp;

  @Fields.number({ dbName: "wgs84_latitude" })
  latitude = 0.0;

  @Fields.number({ dbName: "wgs84_longitude" })
  longitude = 0.0;

  @Fields.integer({ dbName: "school_count" })
  schoolCount = 0;

  @Fields.integer()
  status = 0;
}

export enum CityStatus {
  NoOrdinance,
  NoActiveOrdinance,
  InProgress,
  Published,
}
