import { SmdText } from "@/types/mapTypes";
import { KnexDataProvider } from "remult/remult-knex";

export class StreetMarkdownControllerServer {
  static async getStreetMarkdownTexts(
    cityCode: number,
    ordinanceId: number
  ): Promise<SmdText[]> {
    const knex = KnexDataProvider.getDb();
    const texts = await knex.raw(
      // latest save per founder, id breaks ties of saves within the same second
      `SELECT s.founder_id, s.source_text, f.founder_type_code, f.name FROM (
        SELECT s2.founder_id, s2.source_text,
          ROW_NUMBER() OVER (PARTITION BY s2.founder_id ORDER BY s2.created_at DESC, s2.id DESC) AS rn
        FROM street_markdown s2
        JOIN founder f2 ON f2.id = s2.founder_id
        WHERE s2.ordinance_id = ? AND f2.city_code = ?
      ) s
      JOIN founder f ON s.founder_id = f.id
      WHERE s.rn = 1`,
      [ordinanceId, cityCode]
    );
    // sorted by founder name ("Praha 2" before "Praha 10"), so that the combined
    // text (and line numbers in the map data) is stable and matches the download
    const collator = new Intl.Collator("cs", { numeric: true });
    return texts[0]
      .map((smd: any) => ({
        founderId: Number(smd.founder_id),
        sourceText: smd.source_text,
        founderType: smd.founder_type_code,
        founderName: smd.name,
      }))
      .sort(
        (a: SmdText, b: SmdText) =>
          collator.compare(a.founderName, b.founderName) ||
          a.founderId - b.founderId
      );
  }
}
