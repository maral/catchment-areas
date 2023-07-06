import { GlobalSettings, api } from "@/app/api/[...remult]/route";
import { FounderController } from "@/controllers/FounderController";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportEverything();
  GlobalSettings.isBackendOnly = true;
  await api.withRemult(async () =>
    FounderController.recalculateFounderSchoolCounts()
  );
  console.log("Done!");
};

main();
