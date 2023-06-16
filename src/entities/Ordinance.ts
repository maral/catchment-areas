import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Founder } from "./Founder";

@Entity("ordinances", {
  allowApiRead: Allow.authenticated,
  dbName: "ordinance",
})
export class Ordinance extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Fields.dateOnly({ dbName: "valid_from" })
  validFrom!: Date;

  @Fields.dateOnly({ dbName: "valid_to", allowNull: true })
  validTo?: Date;

  @Fields.boolean({ dbName: "is_active" })
  isActive: boolean = false;

  @Field(() => Founder, { dbName: "founder_id" })
  founder!: Founder;

  @Fields.string({ dbName: "document_url" })
  documentUrl: string = "";
}
