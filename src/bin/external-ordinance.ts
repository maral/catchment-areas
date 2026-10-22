import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { SchoolType } from "@/types/basicTypes";
import { hasExternalMapData } from "@/utils/server/externalMapData";
import { KnexDataProvider } from "remult/remult-knex";

/**
 * Set up an ordinance backed by geodata a city sent us, once converted into
 * our map data (see `convert-external-data.ts`): for every school type the
 * data covers, duplicate the city's latest regular ordinance — same document,
 * number and validity — and mark the copy with the external data key. The copy
 * is left inactive; activate it in the administration.
 *
 *   npm run external-ordinance -- <cityCode> <externalData>
 *
 * Also adds the `ordinance.external_data` column if it's missing. Running it
 * again skips the types that already have such a copy.
 */
const main = async () => {
  const [cityCode, externalData] = [Number(process.argv[2]), process.argv[3]];
  if (!cityCode || !externalData) {
    console.error("Usage: external-ordinance <cityCode> <externalData>");
    process.exit(1);
  }

  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    const knex = KnexDataProvider.getDb();

    if (!(await knex.schema.hasColumn("ordinance", "external_data"))) {
      await knex.schema.alterTable("ordinance", (t) => {
        t.string("external_data", 50).nullable();
      });
      console.log("Added column ordinance.external_data.");
    }

    for (const schoolType of [SchoolType.Kindergarten, SchoolType.Elementary]) {
      if (!hasExternalMapData(externalData, schoolType)) {
        continue;
      }
      const typeName = SchoolType[schoolType];

      const existing = await knex("ordinance")
        .where({
          city_code: cityCode,
          school_type: schoolType,
          external_data: externalData,
        })
        .first("id");
      if (existing) {
        console.log(`${typeName}: already set up as ordinance ${existing.id}.`);
        continue;
      }

      const source = await knex("ordinance")
        .where({ city_code: cityCode, school_type: schoolType })
        .whereNull("external_data")
        .orderBy([
          { column: "valid_from", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .first();
      if (!source) {
        console.log(`${typeName}: no ordinance to duplicate.`);
        continue;
      }

      const { id: sourceId, ...columns } = source;
      const [ordinanceId] = await knex("ordinance").insert({
        ...columns,
        is_active: 0,
        external_data: externalData,
      });
      console.log(
        `${typeName}: ordinance ${sourceId} (${source.number}) duplicated as ${ordinanceId}.`
      );
    }

    await knex.destroy();
  });
};

main();
