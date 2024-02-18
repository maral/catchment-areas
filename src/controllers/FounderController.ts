import { Founder, FounderStatus } from "@/entities/Founder";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { BackendMethod, dbNamesOf } from "remult";
import { KnexDataProvider } from "remult/remult-knex";

export class FounderController {
  @BackendMethod({ allowed: true })
  static async recalculateFounderSchoolCounts(destroyKnex = true) {
    const founders = await dbNamesOf(Founder);
    const schoolFounders = await dbNamesOf(SchoolFounder);
    const knex = KnexDataProvider.getDb();
    await knex.raw(
      `UPDATE ${founders} 
        SET ${founders.schoolCount} = (
          SELECT COUNT(*)
          FROM ${schoolFounders}
          WHERE ${schoolFounders}.${schoolFounders.founderId} = ${founders}.${founders.id}
        ),
        ${founders.status} = ${FounderStatus.NoOrdinance}`
    );
    if (destroyKnex) {
      await knex.destroy();
    }
  }
}
