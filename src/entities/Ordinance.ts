import { SchoolType } from "@/types/basicTypes";
import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { City } from "./City";

@Entity("ordinances", {
  allowApiCrud: Allow.authenticated,
  dbName: "ordinance",
})
export class Ordinance extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Field(() => City, { dbName: "city_code" })
  city!: City;

  @Fields.integer({ dbName: "school_type" })
  schoolType = SchoolType.Elementary;

  @Fields.string()
  number = "";

  @Fields.dateOnly({ dbName: "valid_from" })
  validFrom!: Date;

  @Fields.dateOnly({ dbName: "valid_to", allowNull: true })
  validTo?: Date;

  @Fields.boolean({ dbName: "is_active" })
  isActive: boolean = false;

  @Fields.string({ dbName: "file_name" })
  fileName: string = "";

  @Fields.string({ dbName: "original_text" })
  originalText: string = "";
}
