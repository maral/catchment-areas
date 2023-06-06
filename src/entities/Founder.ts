import { Entity, Field, Fields } from "remult";
import { City } from "./City";
import { CityDistrict } from "./CityDistrict";
import { SchoolFounder } from "./SchoolFounder";

@Entity("founders", { allowApiRead: true, dbName: "founder" })
export class Founder {
  @Fields.integer()
  id = 0;

  @Fields.string()
  name = "";

  @Fields.string()
  ico = "";

  @Fields.object({ dbName: "founder_type_code" })
  founderType = FounderType.City;

  @Field(() => City, { dbName: "city_code" })
  city!: City;

  @Field(() => CityDistrict, { dbName: "city_district_code", allowNull: true })
  cityDistrict?: CityDistrict;

  @Fields.integer((options, remult) => {
    options.serverExpression = async (founder) =>
      (
        await remult
          .repo(SchoolFounder)
          .find({ where: { founderId: founder.id } })
      )?.length;
  })
  schoolCount = 0;
}

export enum FounderType {
  City = 261,
  District = 263,
}
