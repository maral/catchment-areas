import { getRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceController } from "@/controllers/OrdinanceControllerServer";


const main = async () => {
  console.log("Starting...");
  const api = getRemultAPI(true);
  await api.withRemult(OrdinanceController.syncOrdinanceMetadata);

  console.log("Done!");
};

main();
