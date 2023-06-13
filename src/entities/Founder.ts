import { Allow, Entity, EntityBase, Field, Fields, Filter, SqlDatabase, remult } from "remult";
import { City } from "./City";
import { CityDistrict } from "./CityDistrict";
import { SchoolFounder } from "./SchoolFounder";
import { School } from "./School";

@Entity("founders", { allowApiRead: Allow.authenticated, dbName: "founder" })
export class Founder extends EntityBase {
  @Fields.integer()
  id = 0;

  @Fields.string()
  name = "";

  @Fields.string()
  ico = "";

  @Fields.object({ dbName: "founder_type_code" })
  founderType = FounderType.City;

  @Field(() => City, { dbName: "city_code", lazy: true })
  city!: City;

  @Field(() => CityDistrict, {
    dbName: "city_district_code",
    allowNull: true,
    lazy: true,
  })
  cityDistrict?: CityDistrict;

  @Field(() => School, {
    serverExpression: (founder: Founder) =>
      remult
        .repo(SchoolFounder)
        .find({ where: { founderId: founder.id } })
        .then((founders) => founders.map((founder) => founder.school)),
  })
  schools!: School[];

  @Fields.integer((options, remult) => {
    options.serverExpression = async (founder) =>
      await remult.repo(SchoolFounder).count({ founderId: founder.id });
  })
  schoolCount = 0;

}

export enum FounderType {
  City = 261,
  District = 263,
}
