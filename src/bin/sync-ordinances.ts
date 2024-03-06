import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";


const main = async () => {
  console.log("Starting...");
  const api = getAdminRemultAPI();
  await api.withRemult(OrdinanceControllerServer.syncOrdinanceMetadata);

  console.log("Done!");
};

main();
