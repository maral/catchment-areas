import { Ordinance } from "@/entities/Ordinance";
import { remult } from "remult";
import { City } from "../../../entities/City";

const ordinancesRepo = remult.repo(Ordinance);

export async function loadOrdinancesByFounderId(
  founderId: string
): Promise<Ordinance[]> {
  return await ordinancesRepo.find({
    where: { founder: { $id: founderId } },
    orderBy: { validFrom: "desc" },
  });
}

export async function loadOrdinancesByCityCode(
  cityCode: number
): Promise<Ordinance[]> {
  const city = await remult.repo(City).findFirst({ code: cityCode });
  return await ordinancesRepo.find({
    where: { city },
    orderBy: { validFrom: "desc" },
  });
}

export async function getOrdinancesCount(founderId: string): Promise<number> {
  return await ordinancesRepo.count({ founder: { $id: founderId } });
}

export function serializeOrdinances(ordinances: Ordinance[]): any[] {
  return ordinancesRepo.toJson(ordinances);
}

export function deserializeOrdinances(ordinances: any[]): Ordinance[] {
  return ordinancesRepo.fromJson(ordinances);
}
