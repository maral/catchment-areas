import { Orp } from "@/entities/Orp";
import { remult } from "remult";

const orpsRepo = remult.repo(Orp);

export async function loadOrps(page: number, limit: number): Promise<Orp[]> {
  return await orpsRepo.find({
    limit,
    page,
    orderBy: { name: "asc" },
    load: (o) => [o.region!, o.county!],
  });
}

export async function getOrpsCount(): Promise<number> {
  return await orpsRepo.count();
}

export function serializeOrps(orps: Orp[]): any[] {
  return orpsRepo.toJson(orps);
}

export function deserializeOrps(orps: any[]): Orp[] {
  return orpsRepo.fromJson(orps);
}
