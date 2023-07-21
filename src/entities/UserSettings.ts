import { Entity, Field, Fields } from "remult";
import { User } from "./User";

@Entity("user_settings", { dbName: "user_settings", allowApiCrud: true })
export class UserSettings {
  @Fields.autoIncrement()
  id = 0;

  @Field(() => User, { dbName: "user_id", lazy: true })
  user!: User;

  @Fields.boolean()
  isNavbarOpen = true;

  @Fields.json()
  foundersTableSettings = {};
}
