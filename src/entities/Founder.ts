import { Allow, Entity, EntityBase, Field, Fields, remult } from "remult";
import { City } from "./City";
import { CityDistrict } from "./CityDistrict";
import { SchoolFounder } from "./SchoolFounder";
import { School } from "./School";

@Entity("founders", {
  dbName: "founder",
  allowApiCrud: false,
  allowApiRead: Allow.authenticated,
  backendPrefilter: () => ({ schoolCount: { $gt: 1 } }),
})
export class Founder extends EntityBase {
  @Fields.integer()
  id = 0;

  @Fields.string()
  name = "";

  @Fields.string({ dbName: "short_name" })
  shortName = "";

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
    lazy: true,
    serverExpression: (founder: Founder) =>
      remult
        .repo(SchoolFounder)
        .find({ where: { founderId: founder.id } })
        .then((founders) => founders.map((founder) => founder.school)),
  })
  schools!: School[];

  @Fields.integer({ dbName: "school_count" })
  schoolCount = 0;
}

export enum FounderType {
  City = 261,
  District = 263,
}
