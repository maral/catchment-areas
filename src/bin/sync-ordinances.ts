import { GlobalSettings, api } from "@/app/api/[...remult]/route";
import { OrdinanceSyncController } from "@/controllers/OrdinanceSyncController";


const main = async () => {
  console.log("Starting...");
  GlobalSettings.isBackendOnly = true;
  await api.withRemult(OrdinanceSyncController.syncOrdinances);

  console.log("Done!");
};

main();
