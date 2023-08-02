import { importCities } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await importCities();
  console.log("Done!");
};

main();
