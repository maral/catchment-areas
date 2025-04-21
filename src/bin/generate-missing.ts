import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { SchoolType } from "@/types/basicTypes";
import { KnexDataProvider } from "remult/remult-knex";
import { CityController } from "../controllers/CityController";
import { getOrCreateDataForMapByCityCode } from "../utils/server/textToMap";

const main = async () => {
  console.log("Starting...");
  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    console.log("Processing new ordinances for kindergartens...");
    await generateMissing(SchoolType.Kindergarten);
    console.log("Processing new ordinances for elementary schools...");
    await generateMissing(SchoolType.Elementary);

    const knex = KnexDataProvider.getDb();
    await knex.destroy();
  });
  console.log("Done!");
};

const generateMissing = async (schoolType: SchoolType) => {
  const cities = await CityController.loadPublishedCities(schoolType);
  const ordinances = await CityController.loadActiveOrdinancesByCityCodes(
    cities.map((c) => c.code),
    schoolType
  );

  const total = cities.reduce((sum, city) => {
    const ordinance = ordinances[city.code];
    return (
      sum +
      (ordinance && (!ordinance.hasJsonData || !ordinance.hasPolygons) ? 1 : 0)
    );
  }, 0);

  console.log(`There are ${total} unprocessed cities. Let's go!\n`);

  let processed = 0;
  for (const city of cities) {
    const ordinance = ordinances[city.code];
    if (!ordinance || (ordinance.hasJsonData && ordinance.hasPolygons)) {
      continue;
    }

    console.log(`Processing ${city.name}...`);
    await getOrCreateDataForMapByCityCode(
      city.code,
      ordinance.id,
      SchoolType.Elementary
    );
    processed += 1;
    console.log(`Processed ${processed}/${total} - ${city.name}`);
  }
};

main();
