import { Entity, Field, Fields } from "remult";
import { Region } from "@/entities/Region";

@Entity("counties", { allowApiCrud: false, allowApiRead: true, dbName: "county" })
export class County {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => Region, { dbName: "region_code", lazy: true })
  region!: Region;
}
