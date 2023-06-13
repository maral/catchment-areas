import { Entity, Field, Fields } from "remult";
import { City } from "./City";

@Entity("city-districts", { allowApiRead: true, dbName: "city_district" })
export class CityDistrict {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => City, { dbName: "city_code", lazy: true })
  city!: City;
}
