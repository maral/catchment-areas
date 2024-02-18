import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Founder } from "./Founder";
import { OrdinanceMetadata } from "./OrdinanceMetadata";
import { Municipality } from "text-to-map";
import { FeatureCollection } from "@turf/helpers";

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

  @Fields.string({ dbName: "file_name" })
  fileName: string = "";

  @Fields.string({ dbName: "original_text" })
  originalText: string = "";

  @Fields.json({ dbName: "json_data", allowNull: true })
  jsonData!: Municipality[] | null;

  @Fields.json({ dbName: "polygons", allowNull: true })
  polygons!: FeatureCollection[] | null;
}
