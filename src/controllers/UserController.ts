import { BackendMethod, remult } from "remult";
import { User } from "@/entities/User";
import { Role } from "@/utils/shared/permissions";

export class UserController {
  @BackendMethod({ allowed: Role.Admin })
  static async deleteUser(userId: string) {
    const userRepo = remult.repo(User);
    const user = await userRepo.findId(userId);
    if (user) {
      if (user.email.length > 0) {
        await userRepo.update(userId, { ...user, isDeleted: true });
      } else {
        await userRepo.delete(userId);
      }
    }
  }
}
