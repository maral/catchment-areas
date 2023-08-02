import {
  Allow,
  Entity,
  EntityBase,
  Field,
  Fields,
  Filter,
  remult,
} from "remult";
import { City } from "./City";
import { CityDistrict } from "./CityDistrict";
import { Orp } from "./Orp";
import { Region } from "./Region";
import { School } from "./School";
import { SchoolFounder } from "./SchoolFounder";
import { County } from "./County";
import { Ordinance } from "./Ordinance";

@Entity("founders", {
  dbName: "founder",
  allowApiCrud: true,
  allowApiRead: Allow.authenticated,
  backendPrefilter: () => ({ schoolCount: { $gt: 1 } }),
})
export class Founder extends EntityBase {
  @Fields.autoIncrement()
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

  // @Field(() => Ordinance, {
  //   lazy: true,
  //   serverExpression: (founder: Founder) =>
  //     remult
  //       .repo(Ordinance)
  //       .findFirst({
  //         founder: founder,
  //         isActive: true
  //       })
  // })
  // activeOrdinance?: Ordinance;
  
  @Fields.integer()
  status = 0;

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

  static filterByRegion = Filter.createCustom<Founder, { regionCode: string }>(
    async ({ regionCode }) => {
      const region = await remult
        .repo(Region)
        .findFirst({ code: Number(regionCode) });
      return {
        city: { $in: await remult.repo(City).find({ where: { region } }) },
      };
    }
  );

  static filterByCounty = Filter.createCustom<Founder, { countyCode: string }>(
    async ({ countyCode }) => {
      const county = await remult
        .repo(County)
        .findFirst({ code: Number(countyCode) });
      return {
        city: { $in: await remult.repo(City).find({ where: { county } }) },
      };
    }
  );

  static filterByOrp = Filter.createCustom<Founder, { orpCode: string }>(
    async ({ orpCode }) => {
      const orp = await remult.repo(Orp).findFirst({ code: Number(orpCode) });
      return {
        city: { $in: await remult.repo(City).find({ where: { orp } }) },
      };
    }
  );
}

export enum FounderType {
  City = 261,
  District = 263,
}

export enum FounderStatus {
  NoOrdinance,
  NoActiveOrdinance,
  InProgress,
  Published,
}
