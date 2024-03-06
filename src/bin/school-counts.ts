import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";

const main = async () => {
  console.log("Starting...");
  const api = getAdminRemultAPI();
  await api.withRemult(async () =>
    FounderController.recalculateFounderSchoolCounts()
  );
  console.log("Done!");
};

main();
