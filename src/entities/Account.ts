import { RemoveIndex } from "@/utils/types";
import { AdapterAccount } from "@auth/core/adapters";
import { Field, Fields } from "remult";
import { User } from "./User";

export class Account implements RemoveIndex<AdapterAccount> {
  @Fields.uuid()
  id: string = "";

  @Field(() => User)
  user!: User;

  @Fields.string({ dbName: "user_id" })
  userId: string = "";

  @Fields.string()
  type!: "oauth" | "oidc" | "email";

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
  token_type?: string;

  @Fields.string({ allowNull: true })
  scope?: string;

  @Fields.string({ allowNull: true })
  id_token?: string;

  @Fields.string({ allowNull: true })
  session_state?: string;
}
