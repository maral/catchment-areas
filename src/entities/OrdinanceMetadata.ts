import { Allow, Entity, EntityBase, Fields } from "remult";

@Entity("ordinance-metadata", {
  allowApiRead: Allow.authenticated,
  dbName: "ordinance_metadata",
})
export class OrdinanceMetadata extends EntityBase {
  @Fields.string()
  id = "";

  @Fields.string()
  name = "";

  @Fields.string()
  number = "";

  @Fields.string()
  city = "";

  @Fields.string()
  region = "";

  @Fields.dateOnly({ dbName: "valid_from" })
  validFrom!: Date;

  @Fields.dateOnly({ dbName: "valid_to", allowNull: true })
  validTo?: Date;

  @Fields.dateOnly({ dbName: "published_at" })
  publishedAt!: Date;

  @Fields.dateOnly({ dbName: "approved_at" })
  approvedAt!: Date;

  @Fields.integer()
  version = 1;

  @Fields.boolean({ dbName: "is_valid" })
  isValid = true;
}

export interface OrdinanceMetadataX {
  id: string;
  name: string;
  number: string;
  city: string;
  region: string;
  publishedAt: Date;
  effectiveFrom: Date;
  approvedAt: Date;
  version: number;
  isValid: boolean;
}