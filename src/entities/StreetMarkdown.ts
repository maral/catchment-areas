import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Ordinance } from "./Ordinance";
import { User } from "./User";
import { Founder } from "./Founder";

@Entity("street-markdowns", {
  allowApiCrud: Allow.authenticated,
  dbName: "street_markdown",
})
export class StreetMarkdown extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Field(() => User, { dbName: "user_id" })
  user!: User;

  @Field(() => Ordinance, { dbName: "ordinance_id" })
  ordinance!: Ordinance;

  @Field(() => Founder, { dbName: "founder_id" })
  founder!: Founder;

  @Fields.object({ dbName: "state" })
  state = StreetMarkdownState.Initial;

  @Fields.date({ dbName: "created_at" })
  createdAt = new Date();

  @Fields.string()
  comment: string = "";

  @Fields.string({ dbName: "source_text" })
  sourceText: string = "";

  static getAutosaveComment() {
    return `Automatická záloha ${new Date().toLocaleString()}`;
  }
}

export enum StreetMarkdownState {
  Initial = "initial",
  AutoSave = "auto-save",
  Draft = "draft",
  Active = "active",
  Superseded = "superseded",
}
