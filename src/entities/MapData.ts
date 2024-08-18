import { Entity, Fields } from "remult";

import { FeatureCollection } from "@turf/helpers";
import { Municipality } from "text-to-map";

@Entity("map-data", {
  allowApiCrud: false,
  allowApiRead: true,
  dbName: "map_data",
})
export class MapData {
  @Fields.autoIncrement()
  id = 0;

  @Fields.integer({ dbName: "founder_id", allowNull: true })
  founderId: number | null = null;

  @Fields.integer({ dbName: "ordinance_id" })
  ordinanceId = 0;

  @Fields.integer({ dbName: "city_code", allowNull: true })
  cityCode: number | null = null;

  @Fields.json({ dbName: "json_data", allowNull: true })
  jsonData!: Municipality[] | null;

  @Fields.json({ dbName: "polygons", allowNull: true })
  polygons!: FeatureCollection[] | null;
}
