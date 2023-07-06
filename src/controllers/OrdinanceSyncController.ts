import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { syncOrdinancesToDb } from "@/utils/ordinanceSync";
import { BackendMethod, dbNamesOf } from "remult";
import { KnexDataProvider } from "remult/remult-knex";

export class OrdinanceSyncController {
  @BackendMethod({ allowed: true })
  static async syncOrdinances() {
    await syncOrdinancesToDb();
  }
}
