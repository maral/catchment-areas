import { getRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";

const main = async () => {
  console.log("Starting...");
  const api = getRemultAPI(true);
  await api.withRemult(async () =>
    FounderController.recalculateFounderSchoolCounts()
  );
  console.log("Done!");
};

main();
