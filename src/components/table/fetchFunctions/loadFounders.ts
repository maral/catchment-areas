import { Founder } from "@/entities/Founder";
import { remult } from "remult";

const foundersRepo = remult.repo(Founder);

export async function loadFounders(page: number, limit: number): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

export function serializeFounders(founders: Founder[]): any[] {
  return foundersRepo.toJson(founders);
}

export function deserializeFounders(founders: any[]): Founder[] {
  return foundersRepo.fromJson(founders);
}
