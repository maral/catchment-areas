import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Founder } from "./Founder";
import { OrdinanceMetadata } from "./OrdinanceMetadata";

@Entity("ordinances", {
  allowApiCrud: Allow.authenticated,
  dbName: "ordinance",
})
export class Ordinance extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Fields.string()
  number = "";

  @Fields.dateOnly({ dbName: "valid_from" })
  validFrom!: Date;

  @Fields.dateOnly({ dbName: "valid_to", allowNull: true })
  validTo?: Date;

  @Fields.boolean({ dbName: "is_active" })
  isActive: boolean = false;

  @Field(() => Founder, { dbName: "founder_id" })
  founder!: Founder;

  @Field(() => OrdinanceMetadata, { dbName: "ordinance_metadata_id", allowNull: true })
  ordinanceMetadata!: OrdinanceMetadata;

  @Fields.string({ dbName: "document_url" })
  documentUrl: string = "";

  @Fields.string({ dbName: "original_text" })
  originalText: string = "";
}
