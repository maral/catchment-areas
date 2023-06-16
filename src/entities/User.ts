import { RemoveIndex } from "@/utils/types";
import { AdapterUser } from "@auth/core/adapters";
import { Entity, Fields } from "remult";

export enum Role {
  Admin = "admin",
  User = "user",
}

@Entity("users", {
  dbName: "user",
  allowApiCrud: Role.Admin.toString(),
  backendPrefilter: () => ({ isDeleted: false }),
})
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

  @Fields.object()
  role = Role.User;

  @Fields.boolean()
  isDeleted: boolean = false;
}
