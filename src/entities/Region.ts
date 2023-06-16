import { Entity, Fields } from "remult";

@Entity("regions", { allowApiCrud: false, allowApiRead: true, dbName: "region" })
export class Region {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Fields.string({ dbName: "short_name" })
  shortName = "";

  @Fields.integer({ dbName: "csu_code_100" })
  csuCode100 = 0;

  @Fields.string({ dbName: "csu_code_108_nuts" })
  csuCode108Nuts = "";
}
