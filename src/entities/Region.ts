import { Entity, Fields } from "remult";

@Entity("regions", { allowApiCrud: true })
export class Region {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Fields.string()
  short_name = "";

  @Fields.integer()
  csu_code_100 = 0;

  @Fields.string()
  csu_code_108_nuts = "";
}
