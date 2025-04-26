import { MapData } from "@/entities/MapData";
import { Ordinance } from "@/entities/Ordinance";
import { BackendMethod, remult } from "remult";

export class MapDataController {
  @BackendMethod({ allowed: true })
  static async deleteMapData(ordinance: Ordinance, founderId: number) {
    const mapDataRepo = remult.repo(MapData);

    if (!remult.user) {
      return null;
    }

    const mapData = await mapDataRepo.find({
      where: {
        ordinanceId: ordinance.id,
        $or: [
          {
            cityCode: ordinance.city.code,
          },
          { founderId },
        ],
      },
    });
    for (const row of mapData) {
      await mapDataRepo.delete(row);
    }
  }
}
