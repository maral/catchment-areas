import { Entity, Fields } from "remult";
import { RemoveIndex } from "@/utils/shared/types";
import { AdapterUser } from "@auth/core/adapters";
import { Role } from "@/utils/shared/permissions";

@Entity("users", {
  dbName: "user",
  allowApiCrud: Role.Admin,
})
export class User implements RemoveIndex<AdapterUser> {
  @Fields.uuid()
  id: string = "";

  @Fields.string()
  email: string = "";

  @Fields.string()
  futureEmail: string = "";

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
