import { Founder, FounderStatus } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { BackendMethod, remult } from "remult";
import { City } from "../entities/City";
import { revalidatePath } from "next/cache";
import { routes } from "../utils/shared/constants";

export class OrdinanceController {
  @BackendMethod({ allowed: true })
  static async determineActiveOrdinanceByCityCode(cityCode: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const city = await remult.repo(City).findId(cityCode);
    // find all ordinances for the city
    const cityOrdinances = await ordinanceRepo.find({
      where: { city },
      orderBy: { id: "desc" },
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
        if (city && city.status !== FounderStatus.InProgress) {
          await remult
            .repo(City)
            .save({ ...city, status: FounderStatus.InProgress });
        }
      } else {
        // set founder status to NoActiveOrdinance
        if (city && city.status !== FounderStatus.NoActiveOrdinance) {
          await remult
            .repo(Founder)
            .save({ ...city, status: FounderStatus.NoActiveOrdinance });
        }
      }
    }
  }

  @BackendMethod({ allowed: true })
  static async setActiveOrdinance(founderId: number, ordinanceId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const foundersOrdinances = await ordinanceRepo.find({
      where: { founder: { $id: founderId } },
    });
    foundersOrdinances.forEach(async (ordinance) => {
      await ordinanceRepo.update(ordinanceId, {
        ...ordinance,
        isActive: ordinance.id === ordinanceId,
      });
    });
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
}
