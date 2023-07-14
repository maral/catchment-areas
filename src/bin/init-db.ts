import { getRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportEverything();
  const api = getRemultAPI(true);
  await api.withRemult(async () => {
    await FounderController.recalculateFounderSchoolCounts();
    await OrdinanceController.syncOrdinanceMetadata();
  });
  console.log("Done!");
};

main();
