import { County } from "@/entities/County";
import { remult } from "remult";

const countiesRepo = remult.repo(County);

export async function loadCounties(page: number, limit: number): Promise<County[]> {
  return await countiesRepo.find({
    limit,
    page,
    orderBy: { name: "asc" },
    load: (c) => [c.region!]
  });
}

export async function getCountiesCount(): Promise<number> {
  return await countiesRepo.count();
}

export function serializeCounties(counties: County[]): any[] {
  return countiesRepo.toJson(counties);
}

export function deserializeCounties(counties: any[]): County[] {
  return countiesRepo.fromJson(counties);
}
