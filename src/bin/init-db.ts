import { api, remultOptions } from "@/app/api/[...remult]/route";
import { FounderController } from "@/controllers/FounderController";
import { Remult, remult } from "remult";
import { createRemultServer } from "remult/server";
import { downloadAndImportEverything } from "text-to-map";

const main = async () => {
  console.log("Starting...");
  // await downloadAndImportEverything({ dataDir: "./data" });

  const remultObject = new Remult(await remultOptions.dataProvider);

  remultObject.call(FounderController.recalculateFounderSchoolCounts, undefined);

  console.log("Done!");
};

main();
