import { Region } from "@/entities/Region";
import { Entity, Field, Fields } from "remult";
import { County } from "./County";
import { Orp } from "./Orp";

@Entity("cities", { allowApiRead: true, dbName: "city" })
export class City {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { dbName: "region_code" })
  region!: Region;

  @Field(() => County, { dbName: "county_code" })
  county!: County;

  @Field(() => Orp, { dbName: "orp_code" })
  orp!: Orp;
}
