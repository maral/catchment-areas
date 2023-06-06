import {
  downloadAndImportEverything
} from "text-to-map";

console.log("Starting...");
downloadAndImportEverything({ dataDir: "./data" }).then(() => {
  console.log("Done!");
});
