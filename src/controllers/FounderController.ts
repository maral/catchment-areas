import { CityStatus } from "@/entities/City";
import { City, CitySchools, School } from "@/types/embed";
import { KnexDataProvider } from "remult/remult-knex";

export class FounderController {
  static async recalculateFounderSchoolCounts(destroyKnex = true) {
    const knex = KnexDataProvider.getDb();
    await knex.raw(
      `UPDATE founder f
        SET
          kindergarten_count = (
            SELECT COUNT(*)
            FROM school_founder sf
            JOIN school s ON sf.school_izo = s.izo
            WHERE sf.founder_id = f.id AND s.type = 0
          ),
          school_count = (
            SELECT COUNT(*)
            FROM school_founder sf
            JOIN school s ON sf.school_izo = s.izo
            WHERE sf.founder_id = f.id AND s.type = 1
          )`
    );
    if (destroyKnex) {
      await knex.destroy();
    }
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
      const city = school.city_name;
      if (!schoolsByCity.has(city)) {
        schoolsByCity.set(city, []);
      }
      schoolsByCity.get(city)!.push({
        izo: school.izo,
        name: school.name,
        type: school.type,
      });
    }

    const result: CitySchools[] = [];
    schoolsByCity.forEach((schools, cityName) => {
      result.push({ cityName, schools });
    });

    return result;
  }
}
