import { SmdText } from "@/types/mapTypes";
import { KnexDataProvider } from "remult/remult-knex";

export class StreetMarkdownControllerServer {
  static async getStreetMarkdownTexts(
    cityCode: number,
    ordinanceId: number
  ): Promise<SmdText[]> {
    const knex = KnexDataProvider.getDb();
    const texts = await knex.raw(
      `SELECT s.founder_id, s.source_text, f.founder_type_code, f.name FROM street_markdown s
      INNER JOIN (
        SELECT s2.founder_id, MAX(s2.created_at) AS last_created_at FROM street_markdown s2
        JOIN founder f2 ON f2.id = s2.founder_id
        WHERE s2.ordinance_id = ? AND f2.city_code = ?
        GROUP BY s2.founder_id
      ) latest_smd ON latest_smd.founder_id = s.founder_id AND latest_smd.last_created_at = s.created_at
      JOIN founder f ON s.founder_id = f.id`,
      [ordinanceId, cityCode]
    );
    return texts[0].map((smd: any) => ({
      founderId: Number(smd.founder_id),
      sourceText: smd.source_text,
      founderType: smd.founder_type_code,
      founderName: smd.name,
    }));
  }
}
