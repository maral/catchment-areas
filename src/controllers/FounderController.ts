import { Founder, FounderStatus, FounderType } from "@/entities/Founder";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { BackendMethod, dbNamesOf } from "remult";
import { KnexDataProvider } from "remult/remult-knex";
import { City, CitySchools, School } from "../app/embed/Embed";

type SimpleFounder = {
  id: number;
  name: string;
  shortName: string;
  regionName: string;
  status: FounderStatus;
  schoolCount: number;
};

type SimpleOrdinance = {
  id: number;
  founderId: number;
  isActive: boolean;
  fileName: string;
  hasJsonData: boolean;
  hasPolygons: boolean;
};

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

  static async loadPublishedFounders(
    page: number,
    limit: number
  ): Promise<SimpleFounder[]> {
    const knex = KnexDataProvider.getDb();

    return (
      await knex.raw(
        `SELECT id, f.name, f.short_name, r.name AS region_name, status, school_count
        FROM founder f
        JOIN city c ON f.city_code = c.code
        JOIN region r ON c.region_code = r.code
        WHERE f.school_count > 1 AND f.status = ${FounderStatus.Published}
        ORDER BY f.short_name ASC
        LIMIT ${limit}
        OFFSET ${page * limit}`
      )
    )[0].map((f: any) => ({
      id: f.id,
      name: f.name,
      shortName: f.short_name,
      regionName: f.region_name,
      status: f.status,
      schoolCount: f.school_count,
    }));
  }

  static async loadActiveOrdinancesByFounderIds(
    founderIds: number[]
  ): Promise<Map<number, SimpleOrdinance>> {
    const knex = KnexDataProvider.getDb();
    const ordinances = await knex.raw(
      `SELECT id, founder_id, is_active, file_name, json_data IS NOT NULL AS has_json_data, polygons IS NOT NULL as has_polygons
      FROM ordinance o
      WHERE o.founder_id IN (${founderIds.join(", ")}) AND o.is_active = 1`
    );
    return new Map(
      ordinances[0].map((o: any) => [
        o.founder_id,
        {
          id: o.id,
          founderId: o.founder_id,
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
      WHERE sf.school_izo = '${schoolIzo}'`
      )
    )[0]?.[0]?.id;
  }

  static async loadPublishedCities(): Promise<City[]> {
    const knex = KnexDataProvider.getDb();
    const founders = await knex.raw(
      `SELECT city_code, short_name
      FROM founder f
      WHERE status = ${FounderStatus.Published} AND founder_type_code = ${FounderType.City}
      ORDER BY short_name ASC`
    );
    return founders[0].map((f: any) => ({
      code: f.city_code,
      name: f.short_name,
    }));
  }

  static async loadPublishedSchools(): Promise<CitySchools[]> {
    const knex = KnexDataProvider.getDb();
    const schools = await knex.raw(
      `SELECT f.short_name, s.izo, s.name
      FROM founder f
      JOIN school_founder sf ON f.id = sf.founder_id
      JOIN school s ON s.izo = sf.school_izo
      WHERE f.status = ${FounderStatus.Published}
      ORDER BY f.short_name ASC, s.name ASC`
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
