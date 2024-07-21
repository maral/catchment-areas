import { Entity, Fields } from "remult";

@Entity("meta", { allowApiCrud: true, dbName: "meta" })
export class Meta {
  @Fields.string()
  key = "";

  @Fields.string()
  value = "";
}
