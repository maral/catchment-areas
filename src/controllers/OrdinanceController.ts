import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { BackendMethod, remult } from "remult";
import { City, CityStatus } from "../entities/City";

export class OrdinanceController {
  @BackendMethod({ allowed: true })
  static async determineActiveOrdinanceByCityCode(cityCode: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const city = await remult.repo(City).findId(cityCode);
    // find all ordinances for the city
    const cityOrdinances = await ordinanceRepo.find({
      where: { city },
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
        // set founder status to InProgress
        if (city && city.statusElementary !== CityStatus.InProgress) {
          await remult
            .repo(City)
            .save({ ...city, statusElementary: CityStatus.InProgress });
        }
      } else {
        // set founder status to NoActiveOrdinance
        if (city && city.statusElementary !== CityStatus.NoActiveOrdinance) {
          await remult
            .repo(Founder)
            .save({ ...city, status: CityStatus.NoActiveOrdinance });
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
      await ordinanceRepo.delete(ordinance);
      await OrdinanceController.determineActiveOrdinanceByCityCode(cityCode);
    }
  }

  @BackendMethod({ allowed: true })
  static async setActive(ordinanceId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const ordinance = await ordinanceRepo.findId(ordinanceId);
    if (ordinance) {
      const activeOrdinances = await ordinanceRepo.find({
        where: { city: ordinance.city, isActive: true },
      });

      for (const activeOrdinance of activeOrdinances) {
        await ordinanceRepo.save({ ...activeOrdinance, isActive: false });
      }

      await ordinanceRepo.save({ ...ordinance, isActive: true });
    }
  }
}
