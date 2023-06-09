import { User } from "@/entities/User";
import { Adapter } from "@auth/core/adapters";
import { remult } from "remult";
import { api } from "../[...remult]/route";
import { Account } from "@/entities/Account";

const userRepo = remult.repo(User);
const accountRepo = remult.repo(Account);

export function RemultAdapter(): Adapter {
  return {
    async getUser(id: string): Promise<User> {
      return userRepo.findId(id);
      // return api.withRemult(async () => await userRepo.findId(id));
    },

    async getUserByEmail(email: string): Promise<User> {
      return userRepo.findFirst({ email: email });
    },

    async createUser(user: User): Promise<User> {
      const newUser = await userRepo.insert({
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      return newUser;
    },

    async updateUser(user: User): Promise<User> {
      return await userRepo.save({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
    },

    async deleteUser(userId: string) {
      const user = await userRepo.findId(userId);
      if (user) {
        await userRepo.save({
          id: user.id,
          isDeleted: true,
        });
      }
    },

    async linkAccount(account) {
      const user = userRepo.findId(account.userId);
      if (!user) {
        throw new Error("User not found");
      }
      await accountRepo.insert(account);
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const account = await accountRepo.findFirst({ provider, providerAccountId });
      if (!account) {
        throw new Error("Account not found");
      }
      return await accountRepo.delete(account);
    },

    // async createVerificationToken({ identifier, expires, token }) {
    //   return
    // },
    // async useVerificationToken({ identifier, token }) {
    //   return
    // },
  };
}
