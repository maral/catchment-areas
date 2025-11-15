import { downloadAndImportAddressPoints } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportAddressPoints();
  console.log("Done!");
};

main();
