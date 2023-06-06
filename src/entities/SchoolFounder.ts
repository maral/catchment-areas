import { Entity, Fields } from "remult";

@Entity("school-founders", { allowApiRead: true, dbName: "school_founder" })
export class SchoolFounder {
  @Fields.autoIncrement()
  id = 0;

  @Fields.string({ dbName: "school_izo" })
  schoolIzo = "";

  @Fields.integer({ dbName: "founder_id" })
  founderId = 0;
}
