import { syncOrdinancesToDb } from "@/utils/ordinanceSync";
import { BackendMethod } from "remult";

export class OrdinanceSyncController {
  @BackendMethod({ allowed: true })
  static async syncOrdinances() {
    await syncOrdinancesToDb();
  }
}
