import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { Ordinance } from "@/entities/Ordinance";
import { SchoolType } from "@/types/basicTypes";
import { BackendMethod, remult } from "remult";

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

    if (!cityOrdinances || cityOrdinances.length === 0) {
      // set city status to NoOrdinance
      await remult.repo(City).save({
        ...city,
        [getStatusPropertyBySchoolType(schoolType)]: CityStatus.NoOrdinance,
      });
      return;
    }

    // find valid ordinances
    const validOrdinances = cityOrdinances.filter((ordinance) =>
      ordinance.validFrom <= new Date() && ordinance.validTo
        ? ordinance.validTo >= new Date()
        : true
    );
    // an ordinance from the city's own geodata is only ever activated by hand;
    // once active, it stays so until a newer regular ordinance comes
    const regularOrdinances = validOrdinances.filter(
      (ordinance) => !ordinance.externalData
    );
    const activeExternal = validOrdinances.find(
      (ordinance) => ordinance.isActive && ordinance.externalData
    );
    const toActivate =
      activeExternal &&
      (regularOrdinances.length === 0 ||
        regularOrdinances[0].validFrom <= activeExternal.validFrom)
        ? activeExternal
        : regularOrdinances[0];

    // deactivate all other active ordinances
    for (const ordinance of cityOrdinances) {
      if (ordinance.isActive && ordinance.id !== toActivate?.id) {
        await ordinanceRepo.save({ ...ordinance, isActive: false });
      }
    }
    if (toActivate) {
      // activate the first valid ordinance
      await ordinanceRepo.save({ ...toActivate, isActive: true });
      // set city status to InProgress
      if (
        city &&
        city[getStatusPropertyBySchoolType(schoolType)] !==
          CityStatus.InProgress
      ) {
        await remult.repo(City).save({
          ...city,
          [getStatusPropertyBySchoolType(schoolType)]: CityStatus.InProgress,
        });
      }
    } else {
      // set city status to NoExistingOrdinance
      if (
        city &&
        (city[getStatusPropertyBySchoolType(schoolType)] !==
          CityStatus.NoExistingOrdinance ||
          city[getStatusPropertyBySchoolType(schoolType)] !==
            CityStatus.NoOrdinance)
      ) {
        await remult.repo(City).save({
          ...city,
          [getStatusPropertyBySchoolType(schoolType)]: CityStatus.NoOrdinance,
        });
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
