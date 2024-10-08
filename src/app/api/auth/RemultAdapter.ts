import { Account } from "@/entities/Account";
import { User } from "@/entities/User";
import { Adapter } from "next-auth/adapters";
import { Repository } from "remult";
import { getRemult } from "../[...remult]/config";

export function RemultAdapter(): Adapter {
  return {
    async getUser(id) {
      return (await getUserRepo()).findFirst({ id, isDeleted: false });
    },

    async getUserByEmail(email) {
      return (await getUserRepo()).findFirst({
        email: email,
        isDeleted: false,
      });
    },

    async getUserByAccount(provider_providerAccountId) {
      const account = await (
        await getAccountRepo()
      ).findFirst({ ...provider_providerAccountId });
      if (!account) {
        return null;
      }
      return (await getUserRepo()).findId(account.userId);
    },

    async createUser(user) {
      const preapprovedUser = await (
        await getUserRepo()
      ).findFirst({
        futureEmail: user.email,
        isDeleted: false,
      });

      if (preapprovedUser) {
        return await (
          await getUserRepo()
        ).save({
          ...preapprovedUser,
          email: preapprovedUser.futureEmail,
          futureEmail: "",
          name: user.name,
        });
      }

      throw new Error("User not found");
    },

    async updateUser(user) {
      return await (await getUserRepo()).save(user);
    },

    async deleteUser(userId: string): Promise<void> {
      const user = await (await getUserRepo()).findId(userId);
      if (user) {
        await (
          await getUserRepo()
        ).save({
          id: user.id,
          isDeleted: true,
        });
      }
    },

    async linkAccount(account): Promise<void> {
      const user = (await getUserRepo()).findId(account.userId);
      if (!user) {
        throw new Error("User not found");
      }
      await (await getAccountRepo()).insert(account);
    },

    async unlinkAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }): Promise<void> {
      const account = await (
        await getAccountRepo()
      ).findFirst({
        provider,
        providerAccountId,
      });
      if (!account) {
        throw new Error("Account not found");
      }
      await (await getAccountRepo()).delete(account);
    },

    async createVerificationToken({ identifier, expires, token }) {
      return null;
    },
    async useVerificationToken({ identifier, token }) {
      return null;
    },

    // @ts-ignore
    async createSession({ sessionToken, userId, expires }) {
      return null;
    },
    async getSessionAndUser(sessionToken) {
      return null;
    },
    async updateSession({ sessionToken }) {
      return null;
    },
    async deleteSession(sessionToken) {
      return;
    },
  };
}

let _userRepo: Repository<User>;
let _accountRepo: Repository<Account>;

const getUserRepo = async (): Promise<Repository<User>> => {
  if (!_userRepo) {
    _userRepo = (await getRemult()).repo(User);
  }
  return _userRepo;
};

const getAccountRepo = async (): Promise<Repository<Account>> => {
  if (!_accountRepo) {
    _accountRepo = (await getRemult()).repo(Account);
  }
  return _accountRepo;
};
