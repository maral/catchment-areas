import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";
import { CityController } from "../controllers/CityController";

const main = async () => {
  console.log("Starting...");
  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    await FounderController.recalculateFounderSchoolCounts(false);
    await CityController.recalculateCitiesSchoolCounts();
  });
  console.log("Done!");
};

main();
