import { Ordinance } from "@/entities/Ordinance";
import { remult } from "remult";
import { City } from "../../../entities/City";
import { SchoolType } from "@/entities/School";

const ordinancesRepo = remult.repo(Ordinance);

export async function loadOrdinancesByCityCode(
  cityCode: number,
  schoolType: SchoolType
): Promise<Ordinance[]> {
  const city = await remult.repo(City).findFirst({ code: cityCode });

  return await ordinancesRepo.find({
    where: { city, schoolType },
    orderBy: { validFrom: "desc" },
  });
}

export function serializeOrdinances(ordinances: Ordinance[]): any[] {
  return ordinancesRepo.toJson(ordinances);
}

export function deserializeOrdinances(ordinances: any[]): Ordinance[] {
  return ordinancesRepo.fromJson(ordinances);
}
