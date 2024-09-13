import { Ordinance } from "@/entities/Ordinance";
import { BackendMethod, remult } from "remult";
import { MapData } from "../entities/MapData";

export class MapDataController {
  @BackendMethod({ allowed: true })
  static async deleteMapData(ordinance: Ordinance) {
    const mapDataRepo = remult.repo(MapData);

    if (!remult.user) {
      return null;
    }

    const mapData = await mapDataRepo.find({
      where: {
        ordinanceId: ordinance.id,
        cityCode: ordinance.city.code,
      },
    });
    for (const row of mapData) {
      await mapDataRepo.delete(row);
    }
  }
}
