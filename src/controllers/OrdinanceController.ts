import { syncOrdinancesToDb } from "@/utils/server/ordinanceSync";
import { BackendMethod } from "remult";

export class OrdinanceController {
  @BackendMethod({ allowed: true })
  static async syncOrdinanceMetadata() {
    await syncOrdinancesToDb();
  }
}
