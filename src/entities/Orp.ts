import { Entity, Field, Fields } from "remult";
import { Region } from "@/entities/Region";
import { County } from "./County";

@Entity("orps", { allowApiRead: true, dbName: "orp" })
export class Orp {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { dbName: "region_code", lazy: true })
  region!: Region;

  @Field(() => County, { dbName: "county_code", lazy: true })
  county!: County;
}
