import { Founder } from "@/entities/Founder";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { BackendMethod, SqlDatabase, dbNamesOf } from "remult";

export class FounderController {
  @BackendMethod({ allowed: true })
  static async recalculateFounderSchoolCounts() {
    const founders = await dbNamesOf(Founder);
    const schoolFounders = await dbNamesOf(SchoolFounder);
    const sql = SqlDatabase.getDb();
    let command = sql.createCommand();
    await command.execute(
      `UPDATE ${founders} 
        SET ${founders.schoolCount} = (
          SELECT COUNT(*)
          FROM ${schoolFounders}
          WHERE ${schoolFounders}.${schoolFounders.founderId} = ${founders}.${founders.id}
        );`
    );
  }
}
