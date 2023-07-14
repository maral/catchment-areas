import { Entity, Field, Fields } from "remult";
import { City } from "./City";

@Entity("streets", {
  allowApiCrud: false,
  allowApiRead: true,
  dbName: "street",
})
export class Street {
  @Fields.integer()
  code = 0;

  @Fields.string()
  name = "";

  @Field(() => City, { dbName: "city_code", lazy: true })
  city!: City;
}
