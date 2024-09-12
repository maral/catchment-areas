import { FounderStatus, FounderType } from "@/entities/Founder";
import { KnexDataProvider } from "remult/remult-knex";
import { City, CitySchools, School } from "../app/embed/Embed";
import { CityStatus } from "../entities/City";

type SimpleFounder = {
  id: number;
  name: string;
  shortName: string;
  regionName: string;
  status: FounderStatus;
  schoolCount: number;
};

export type SimpleOrdinance = {
  id: number;
  founderId: number;
  isActive: boolean;
  fileName: string;
  hasJsonData: boolean;
  hasPolygons: boolean;
};

export type SimpleOrdinanceMap = Record<number, SimpleOrdinance>;

export class CityController {
  static async recalculateCitiesSchoolCounts(destroyKnex = true) {
    const knex = KnexDataProvider.getDb();
    await knex.raw(
      `UPDATE city c
        SET school_count = IFNULL((
          SELECT COUNT(DISTINCT sf.school_izo)
          FROM founder f
          JOIN school_founder sf ON sf.founder_id = f.id
          WHERE f.city_code = c.code
          GROUP BY f.city_code
        ), 0)`
    );
    if (destroyKnex) {
      await knex.destroy();
    }
  }

  static async loadActiveOrdinancesByCityCodes(
    cityCodes: number[]
  ): Promise<Record<number, SimpleOrdinance>> {
    const knex = KnexDataProvider.getDb();
    const ordinances = await knex.raw(
      `SELECT o.id, o.city_code, is_active, file_name, m.json_data IS NOT NULL AS has_json_data, m.polygons IS NOT NULL as has_polygons
      FROM ordinance o
      LEFT JOIN map_data m ON o.id = m.ordinance_id AND o.city_code = m.city_code
      WHERE o.city_code IN (${cityCodes.join(", ")}) AND o.is_active = 1`
    );
    return Object.fromEntries(
      ordinances[0].map((o: any) => [
        o.city_code,
        {
          id: o.id,
          cityCode: o.city_code,
          isActive: o.is_active === 1,
          fileName: o.file_name,
          hasJsonData: o.has_json_data === 1,
          hasPolygons: o.has_polygons === 1,
        },
      ])
    );
  }

  static async findFounderIdBySchoolIzo(schoolIzo: string): Promise<number> {
    const knex = KnexDataProvider.getDb();
    return (
      await knex.raw(
        `SELECT f.id
        FROM founder f
        JOIN school_founder sf ON f.id = sf.founder_id
        WHERE sf.school_izo = '?'`,
        [schoolIzo]
      )
    )[0]?.[0]?.id;
  }

  static async loadPublishedCities(): Promise<
    (City & { regionName: string; schoolCount: number })[]
  > {
    const knex = KnexDataProvider.getDb();
    return (
      await knex.raw(
        `SELECT c.code, c.name, r.name AS region_name, c.school_count
        FROM city c
        JOIN region r ON c.region_code = r.code
        WHERE status = ${CityStatus.Published}
        ORDER BY name ASC`
      )
    )[0].map((row: any) => ({
      code: row.code,
      name: row.name,
      regionName: row.region_name,
      schoolCount: row.school_count,
    }));
  }

  static async loadPublishedSchools(): Promise<CitySchools[]> {
    const knex = KnexDataProvider.getDb();
    const schools = await knex.raw(
      `SELECT c.name AS city_name, s.izo, s.name
      FROM city c
      JOIN founder f ON f.city_code = c.code
      JOIN school_founder sf ON f.id = sf.founder_id
      JOIN school s ON s.izo = sf.school_izo
      WHERE f.status = ${CityStatus.Published}
      ORDER BY c.name ASC, s.name ASC`
    );

    const schoolsByCity = new Map<string, School[]>();
    for (const school of schools[0]) {
      const city = school.short_name;
      if (!schoolsByCity.has(city)) {
        schoolsByCity.set(city, []);
      }
      schoolsByCity.get(city)!.push({
        izo: school.izo,
        name: school.name,
      });
    }

    const result: CitySchools[] = [];
    schoolsByCity.forEach((schools, cityName) => {
      result.push({ cityName, schools });
    });

    return result;
  }
}
