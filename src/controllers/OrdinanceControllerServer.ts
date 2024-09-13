import { syncOrdinancesToDb } from "@/utils/server/ordinanceMetadataSync";
import {
  FeatureCollection,
  Geometry,
  GeometryCollection,
  Properties,
} from "@turf/helpers";
import { BackendMethod } from "remult";
import { KnexDataProvider } from "remult/remult-knex";
import { Municipality } from "text-to-map";

export class OrdinanceControllerServer {
  @BackendMethod({ allowed: true })
  static async syncOrdinanceMetadata() {
    await syncOrdinancesToDb();
  }

  static async getActiveOrdinanceBySchoolIzo(
    schoolIzo: string
  ): Promise<{ cityCode: number; ordinanceId: number } | null> {
    const knex = KnexDataProvider.getDb();

    const result = (
      await knex.raw(
        `SELECT f.city_code, o.id AS ordinance_id FROM school_founder sf
        JOIN founder f ON sf.founder_id = f.id
        JOIN ordinance o ON f.city_code = o.city_code
        WHERE sf.school_izo = ? AND o.is_active = 1`,
        [schoolIzo]
      )
    )[0]?.[0];

    return result
      ? { cityCode: result.city_code, ordinanceId: result.ordinance_id }
      : null;
  }

  static async getActiveOrdinanceIdsByCityCodes(
    cityCodes: number[]
  ): Promise<{ cityCode: number; ordinanceId: number }[]> {
    const knex = KnexDataProvider.getDb();

    return (
      await knex.raw(
        `SELECT city_code, id FROM ordinance
          WHERE city_code IN (${cityCodes
            .map((_) => "?")
            .join(",")}) AND is_active = 1`,
        [...cityCodes]
      )
    )[0]?.map((row: any) => ({
      cityCode: row.city_code,
      ordinanceId: row.id,
    }));
  }

  static async setJsonData(
    cityCode: number,
    ordinanceId: number,
    jsonData: Municipality[]
  ) {
    const knex = KnexDataProvider.getDb();
    await knex.raw(
      `UPDATE map_data SET json_data = ? WHERE city_code = ? AND ordinance_id = ? AND founder_id IS NULL`,
      [JSON.stringify(jsonData), cityCode, ordinanceId]
    );
  }

  static async setPolygons(
    cityCode: number,
    ordinanceId: number,
    polygons: FeatureCollection<Geometry | GeometryCollection, Properties>[]
  ) {
    const knex = KnexDataProvider.getDb();
    await knex.raw(
      `UPDATE map_data SET polygons = ? WHERE city_code = ? AND ordinance_id = ? AND founder_id IS NULL`,
      [JSON.stringify(polygons), cityCode, ordinanceId]
    );
  }
}
