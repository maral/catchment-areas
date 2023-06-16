import { Entity, Field, Fields, remult } from "remult";
import { School } from "./School";

@Entity("school-founders", { allowApiCrud: false, allowApiRead: true, dbName: "school_founder" })
export class SchoolFounder {
  @Fields.autoIncrement()
  id = 0;

  @Fields.string({ dbName: "school_izo" })
  schoolIzo = "";

  @Field(() => School, { dbName: "school_izo", lazy: true })
  school!: School;

  @Fields.integer({ dbName: "founder_id" })
  founderId = 0;
}
