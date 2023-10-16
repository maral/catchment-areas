import { Founder, FounderStatus } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { BackendMethod, remult } from "remult";

export class OrdinanceController {
  @BackendMethod({ allowed: true })
  static async determineActiveOrdinanceByFounderId(founderId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const founder = await remult.repo(Founder).findId(founderId);
    // find all ordinances for the founder
    const foundersOrdinances = await ordinanceRepo.find({
      where: { founder: { $id: founderId } },
      orderBy: { id: "desc" },
    });
    if (foundersOrdinances && foundersOrdinances.length) {
      // deactivate all active ordinances
      const activeOrdinances = foundersOrdinances.filter(
        (ordinance) => ordinance.isActive
      );
      if (activeOrdinances.length) {
        activeOrdinances.forEach(async (ordinance) => {
          await ordinanceRepo.save({ ...ordinance, isActive: false });
        });
      }
      // find valid ordinances
      const validOrdinances = foundersOrdinances.filter((ordinance) =>
        ordinance.validFrom <= new Date() && ordinance.validTo
          ? ordinance.validTo >= new Date()
          : true
      );
      if (validOrdinances.length) {
        // activate the first valid ordinance
        await ordinanceRepo.save({ ...validOrdinances[0], isActive: true });
        // set founder status to InProgress
        if (founder && founder.status !== FounderStatus.InProgress) {
          await remult
            .repo(Founder)
            .save({ ...founder, status: FounderStatus.InProgress });
        }
      } else {
        // set founder status to NoActiveOrdinance
        if (founder && founder.status !== FounderStatus.NoActiveOrdinance) {
          await remult
            .repo(Founder)
            .save({ ...founder, status: FounderStatus.NoActiveOrdinance });
        }
      }
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteOrdinance(ordinanceId: number) {
    const ordinanceRepo = remult.repo(Ordinance);
    const ordinance = await ordinanceRepo.findId(ordinanceId);
    if (ordinance) {
      const founderId = ordinance.founder.id;
      await ordinanceRepo.delete(ordinance);
      await OrdinanceController.determineActiveOrdinanceByFounderId(founderId);
    }
  }
}
