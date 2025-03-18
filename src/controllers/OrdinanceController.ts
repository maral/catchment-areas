import { Ordinance } from "@/entities/Ordinance";
import { SchoolType } from "@/entities/School";
import { BackendMethod, remult } from "remult";
import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "../entities/City";

export class OrdinanceController {
  @BackendMethod({ allowed: true })
  static async determineActiveOrdinanceByCityCode(
    cityCode: number,
    schoolType: SchoolType
  ) {
    const ordinanceRepo = remult.repo(Ordinance);
    const city = await remult.repo(City).findId(cityCode);
    // find all ordinances for the city and school type
    const cityOrdinances = await ordinanceRepo.find({
      where: { city, schoolType },
      orderBy: { validFrom: "desc" },
    });
    if (cityOrdinances && cityOrdinances.length) {
      // deactivate all active ordinances
      const activeOrdinances = cityOrdinances.filter(
        (ordinance) => ordinance.isActive
      );
      if (activeOrdinances.length) {
        activeOrdinances.forEach(async (ordinance) => {
          await ordinanceRepo.save({ ...ordinance, isActive: false });
        });
      }
      // find valid ordinances
      const validOrdinances = cityOrdinances.filter((ordinance) =>
        ordinance.validFrom <= new Date() && ordinance.validTo
          ? ordinance.validTo >= new Date()
          : true
      );
      if (validOrdinances.length) {
        // activate the first valid ordinance
        await ordinanceRepo.save({ ...validOrdinances[0], isActive: true });
        // set city status to InProgress
        if (
          city &&
          (schoolType === SchoolType.Kindergarten
            ? city.statusElementary
            : city.statusKindergarten) !== CityStatus.InProgress
        ) {
          await remult.repo(City).save({
            ...city,
            [getStatusPropertyBySchoolType(schoolType)]: CityStatus.InProgress,
          });
        }
      } else {
        // set city status to NoActiveOrdinance
        if (city && city.statusElementary !== CityStatus.NoActiveOrdinance) {
          await remult.repo(City).save({
            ...city,
            [getStatusPropertyBySchoolType(schoolType)]:
              CityStatus.NoActiveOrdinance,
          });
        }
      }
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteOrdinance(ordinanceId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const ordinance = await ordinanceRepo.findId(ordinanceId);
    if (ordinance) {
      const cityCode = ordinance.city.code;
      const schoolType = ordinance.schoolType;
      await ordinanceRepo.delete(ordinance);
      await OrdinanceController.determineActiveOrdinanceByCityCode(
        cityCode,
        schoolType
      );
    }
  }

  @BackendMethod({ allowed: true })
  static async setActive(ordinanceId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const ordinance = await ordinanceRepo.findId(ordinanceId);
    if (ordinance) {
      const activeOrdinances = await ordinanceRepo.find({
        where: {
          city: ordinance.city,
          schoolType: ordinance.schoolType,
          isActive: true,
        },
      });

      for (const activeOrdinance of activeOrdinances) {
        await ordinanceRepo.save({ ...activeOrdinance, isActive: false });
      }

      await ordinanceRepo.save({ ...ordinance, isActive: true });
    }
  }
}
