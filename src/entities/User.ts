import { RemoveIndex } from "@/utils/types";
import { AdapterUser } from "@auth/core/adapters";
import { Fields } from "remult";

export class User implements RemoveIndex<AdapterUser> {
  @Fields.uuid()
  id: string = "";

  @Fields.string()
  email: string = "";

  @Fields.date()
  emailVerified: Date | null = null;

  @Fields.string({ allowNull: true })
  image: string = "";

  @Fields.boolean()
  isDeleted: boolean = false;
}
