import { GlobalSettings, api } from "@/app/api/[...remult]/route";
import { OrdinanceController } from "@/controllers/OrdinanceController";


const main = async () => {
  console.log("Starting...");
  GlobalSettings.isBackendOnly = true;
  await api.withRemult(OrdinanceController.syncOrdinanceMetadata);

  console.log("Done!");
};

main();
