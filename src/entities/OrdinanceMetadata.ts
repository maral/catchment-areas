import { Allow, Entity, EntityBase, Fields } from "remult";
import { SchoolType } from "./School";

@Entity("ordinance-metadata", {
  allowApiCrud: Allow.authenticated,
  dbName: "ordinance_metadata",
})
export class OrdinanceMetadata extends EntityBase {
  @Fields.string()
  id = "";

  @Fields.integer({ dbName: "city_code", allowNull: true })
  cityCode: number | null = null;

  @Fields.object({ dbName: "school_type" })
  schoolType = SchoolType.Elementary;

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

  @Fields.boolean({ dbName: "is_new" })
  isNewOrdinance = true;

  @Fields.boolean({ dbName: "is_rejected" })
  isRejected = false;
}
