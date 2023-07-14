import { getRemultAPI } from "@/app/api/[...remult]/config";
import { FounderController } from "@/controllers/FounderController";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  // await downloadAndImportEverything();
  const api = getRemultAPI(true);
  await api.withRemult(async () =>
    FounderController.recalculateFounderSchoolCounts()
  );
  console.log("Done!");
};

main();
