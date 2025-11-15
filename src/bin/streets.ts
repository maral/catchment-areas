import { downloadAndImportStreets } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportStreets({}, true);
  console.log("Done!");
};

main();
