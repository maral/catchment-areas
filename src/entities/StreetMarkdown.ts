import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Ordinance } from "./Ordinance";
import { User } from "./User";

@Entity("ordinances", {
  allowApiRead: Allow.authenticated,
  dbName: "street_markdown",
})
export class StreetMarkdown extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Field(() => User, { dbName: "user_id" })
  user!: User;

  @Field(() => Ordinance, { dbName: "ordinance_id" })
  ordinance!: Ordinance;

  @Fields.boolean({ dbName: "is_active" })
  isActive: boolean = false;

  @Fields.date({ dbName: "created_at" })
  createdAt = new Date();

  @Fields.string()
  comment: string = "";

  @Fields.string({ dbName: "source_text" })
  sourceText: string = "";

  @Fields.json({ dbName: "json_data" })
  jsonData: string = "";
}
