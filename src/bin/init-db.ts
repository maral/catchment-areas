import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportEverything();
  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    await FounderController.recalculateFounderSchoolCounts(false);
    await OrdinanceControllerServer.syncOrdinanceMetadata();
  });
  console.log("Done!");
};

main();
