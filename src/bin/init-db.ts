import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";
import { downloadAndImportEverything } from "text-to-map";
import { CityController } from "../controllers/CityController";

const main = async () => {
  console.log("Starting...");
  await downloadAndImportEverything();
  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    await FounderController.recalculateFounderSchoolCounts(false);
    await CityController.recalculateCitiesSchoolCounts(false);
    await OrdinanceControllerServer.syncOrdinanceMetadata();
  });
  console.log("Done!");
};

main();
