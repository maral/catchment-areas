import { GlobalSettings, api, remultOptions } from "@/app/api/[...remult]/route";
import { FounderController } from "@/controllers/FounderController";
import { textToMapOptions } from "@/utils/constants";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportEverything(textToMapOptions);
  GlobalSettings.isBackendOnly = true;
  await api.withRemult(async () => FounderController.recalculateFounderSchoolCounts());
  console.log("Done!");
};

main();
