import { Ordinance } from "@/entities/Ordinance";
import { remult } from "remult";
import { City } from "../../../entities/City";
import { SchoolTypeValues } from "@/types/schoolTypes";
import { SchoolType } from "@/entities/School";

const ordinancesRepo = remult.repo(Ordinance);

export async function loadOrdinancesByCityCode(
  cityCode: number,
  type: string
): Promise<Ordinance[]> {
  const city = await remult.repo(City).findFirst({ code: cityCode });

  const schoolTypeCode =
    type === SchoolTypeValues.kindergarten
      ? SchoolType.Kindergarten
      : SchoolType.Elementary;

  return await ordinancesRepo.find({
    where: { city, schoolType: schoolTypeCode },
    orderBy: { validFrom: "desc" },
  });
}

export function serializeOrdinances(ordinances: Ordinance[]): any[] {
  return ordinancesRepo.toJson(ordinances);
}

export function deserializeOrdinances(ordinances: any[]): Ordinance[] {
  return ordinancesRepo.fromJson(ordinances);
}
