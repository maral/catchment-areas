import { Entity, Field, Fields } from "remult";
import { Region } from "@/entities/Region";

@Entity("counties", { allowApiCrud: true, dbName: "county" })
export class County {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { key: "region_code" })
  region?: Region;
}
