import { RemoveIndex } from "@/utils/types";
import { AdapterUser } from "@auth/core/adapters";
import { Entity, Fields } from "remult";

@Entity("users", { dbName: "user" })
export class User implements RemoveIndex<AdapterUser> {
  @Fields.uuid()
  id: string = "";

  @Fields.string()
  email: string = "";

  @Fields.date()
  emailVerified: Date | null = null;

  @Fields.string({ allowNull: true })
  name: string | null = "";

  @Fields.string({ allowNull: true })
  image: string | null = null;

  @Fields.boolean()
  isDeleted: boolean = false;
}
