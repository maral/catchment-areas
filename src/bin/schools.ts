import { downloadAndImportSchools } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportSchools();
  console.log("Done!");
};

main();
