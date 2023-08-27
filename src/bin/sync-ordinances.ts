import { getRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";


const main = async () => {
  console.log("Starting...");
  const api = getRemultAPI(true);
  await api.withRemult(OrdinanceControllerServer.syncOrdinanceMetadata);

  console.log("Done!");
};

main();
