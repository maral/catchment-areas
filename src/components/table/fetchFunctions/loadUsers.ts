import { User } from "@/entities/User";
import { remult } from "remult";
import { Role } from "../../../utils/shared/permissions";

const usersRepo = remult.repo(User);

export async function loadUsers(page: number, limit: number): Promise<User[]> {
  return await usersRepo.find({
    limit,
    page,
    orderBy: { name: "asc" },
    where: { isDeleted: false },
  });
}

export async function getUsersCount(): Promise<number> {
  return await usersRepo.count();
}

export function serializeUsers(users: User[]): any[] {
  return usersRepo.toJson(users);
}

export function deserializeUsers(users: any[]): User[] {
  return usersRepo.fromJson(users);
}
