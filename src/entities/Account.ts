import { RemoveIndex } from "@/utils/shared/types";
import { AdapterAccount } from "next-auth/adapters";
import { Entity, Fields } from "remult";

@Entity("accounts", { dbName: "account", allowApiCrud: false })
export class Account implements RemoveIndex<AdapterAccount> {
  @Fields.uuid()
  id: string = "";

  @Fields.string({ dbName: "user_id" })
  userId: string = "";

  @Fields.string()
  type!: AdapterAccount["type"];

  @Fields.string()
  provider!: string;

  @Fields.string()
  providerAccountId!: string;

  @Fields.string({ allowNull: true })
  refresh_token?: string;

  @Fields.string({ allowNull: true })
  access_token?: string;

  @Fields.integer({ allowNull: true })
  expires_at?: number;

  @Fields.string({ allowNull: true })
  token_type?: AdapterAccount["token_type"];

  @Fields.string({ allowNull: true })
  scope?: string;

  @Fields.string({ allowNull: true })
  id_token?: string;

  @Fields.string({ allowNull: true })
  session_state?: string;
}
