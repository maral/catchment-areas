import { CityStatus, getStatusColumnBySchoolType } from "@/entities/City";
import { SchoolType } from "@/types/basicTypes";
import { City, CitySchools, School } from "@/types/embed";
import { KnexDataProvider } from "remult/remult-knex";

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
        SET
          kindergarten_count = IFNULL((
            SELECT COUNT(DISTINCT sf.school_izo)
            FROM founder f
            JOIN school_founder sf ON sf.founder_id = f.id
            JOIN school s ON s.izo = sf.school_izo
            WHERE f.city_code = c.code AND s.type = 0
            GROUP BY f.city_code
          ), 0),
          school_count = IFNULL((
            SELECT COUNT(DISTINCT sf.school_izo)
            FROM founder f
            JOIN school_founder sf ON sf.founder_id = f.id
            JOIN school s ON s.izo = sf.school_izo
            WHERE f.city_code = c.code AND s.type = 1
            GROUP BY f.city_code
          ), 0)
        `
    );
    if (destroyKnex) {
      await knex.destroy();
    }
  }

  static async loadActiveOrdinancesByCityCodes(
    cityCodes: number[],
    schoolType: SchoolType
  ): Promise<Record<number, SimpleOrdinance>> {
    const knex = KnexDataProvider.getDb();
    const ordinances = await knex.raw(
      `SELECT o.id, o.city_code, is_active, file_name, m.json_data IS NOT NULL AS has_json_data, m.polygons IS NOT NULL as has_polygons
      FROM ordinance o
      LEFT JOIN map_data m ON o.id = m.ordinance_id AND o.city_code = m.city_code
      WHERE o.city_code IN (${cityCodes.join(
        ", "
      )}) AND o.is_active = 1 AND o.school_type = ?`,
      [schoolType]
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

  static async loadPublishedCities(
    schoolType: SchoolType | null = null
  ): Promise<(City & { regionName: string; schoolCount: number })[]> {
    const knex = KnexDataProvider.getDb();

    const whereClause =
      schoolType !== null
        ? `${getStatusColumnBySchoolType(schoolType)} = '${
            CityStatus.Published
          }'`
        : `(${getStatusColumnBySchoolType(SchoolType.Elementary)} = '${
            CityStatus.Published
          }' OR ${getStatusColumnBySchoolType(SchoolType.Kindergarten)} = '${
            CityStatus.Published
          }')`;

    return (
      await knex.raw(
        `SELECT c.code, c.name, r.name AS region_name, c.school_count, c.kindergarten_count, c.status_kindergarten, c.status_elementary
        FROM city c
        JOIN region r ON c.region_code = r.code
        WHERE ${whereClause}
        ORDER BY name ASC`
      )
    )[0].map((row: any) => ({
      code: row.code,
      name: row.name,
      regionName: row.region_name,
      schoolCount: row.school_count,
      kindergartenCount: row.kindergarten_count,
      statusKindergarten: row.status_kindergarten,
      statusElementary: row.status_elementary,
    }));
  }

  static async loadPublishedSchools(
    schoolType: SchoolType | null = null
  ): Promise<CitySchools[]> {
    const knex = KnexDataProvider.getDb();

    const whereClause =
      schoolType !== null
        ? `c.${getStatusColumnBySchoolType(schoolType)} = '${
            CityStatus.Published
          }'`
        : `(c.${getStatusColumnBySchoolType(SchoolType.Elementary)} = '${
            CityStatus.Published
          }' OR c.${getStatusColumnBySchoolType(SchoolType.Kindergarten)} = '${
            CityStatus.Published
          }')`;

    const schools = await knex.raw(
      `SELECT c.name AS city_name, c.code AS city_code, s.izo, s.name, s.type
      FROM city c
      JOIN founder f ON f.city_code = c.code
      JOIN school_founder sf ON f.id = sf.founder_id
      JOIN school s ON s.izo = sf.school_izo
      WHERE ${whereClause}
      ORDER BY c.name ASC, s.name ASC`
    );

    const schoolsByCity = new Map<
      string,
      { cityCode: number; schools: School[] }
    >();

    for (const school of schools[0]) {
      const cityName = school.city_name;
      const cityCode = school.city_code;

      if (!schoolsByCity.has(cityName)) {
        schoolsByCity.set(cityName, {
          cityCode,
          schools: [],
        });
      }

      schoolsByCity.get(cityName)!.schools.push({
        izo: school.izo,
        name: school.name,
        type: school.type,
      });
    }

    const result: CitySchools[] = [];
    schoolsByCity.forEach(({ cityCode, schools }, cityName) => {
      result.push({ cityName, cityCode, schools });
    });
    return result;
  }
}
