import { syncOrdinancesToDb } from "@/utils/server/ordinanceMetadataSync";
import { BackendMethod } from "remult";

export class OrdinanceControllerServer {
  @BackendMethod({ allowed: true })
  static async syncOrdinanceMetadata() {
    await syncOrdinancesToDb();
  }
}
