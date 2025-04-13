import { User } from "@/entities/User";
import { remult } from "remult";

const usersRepo = remult.repo(User);

export async function loadUsers(): Promise<User[]> {
  return await usersRepo.find({
    orderBy: { name: "asc" },
    where: { isDeleted: false },
  });
}

export function serializeUsers(users: User[]): any[] {
  return usersRepo.toJson(users);
}

export function deserializeUsers(users: any[]): User[] {
  return usersRepo.fromJson(users);
}
