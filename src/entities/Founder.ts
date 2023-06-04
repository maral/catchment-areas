import { Entity, Field, Fields } from "remult";
import { Region } from "@/entities/Region";

@Entity("founders", { allowApiRead: true, dbName: "founder" })
export class County {
  @Fields.integer()
  id = 0;

  @Fields.string()
  name = "";

  @Fields.string()
  ico = "";

  @Field(() => Region, { key: "region_code",  })
  regionName = "";

  @Field(() => Region, { dbName: "region_code" })
  region?: Region;
}
