import { Entity, Fields } from "remult";

@Entity("schools", { allowApiCrud: false, allowApiRead: true, dbName: "school" })
export class School {
  @Fields.string()
  izo = "";

  @Fields.string()
  redizo = "";

  @Fields.string()
  name = "";

  @Fields.integer()
  capacity = 0;
}
