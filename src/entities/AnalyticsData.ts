import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import { Entity, Field, Fields } from "remult";
import { City } from "./City";
import { School } from "./School";

@Entity("analytics-data", {
  dbName: "analytics_data",
})
export class AnalyticsData {
  @Fields.autoIncrement()
  id = 0;

  @Field(() => School, { dbName: "school_izo", lazy: true, allowNull: true })
  school?: School;

  @Fields.integer()
  type: number = AnalyticsDataType.StudentsTotal;

  @Fields.number({ allowNull: true })
  percentage: number | null = null;

  @Fields.integer()
  count: number = 0;

  @Fields.integer({ dbName: "school_type", allowNull: true })
  schoolType: number | null = SchoolType.Kindergarten;

  @Field(() => City, { dbName: "city_code", lazy: true, allowNull: true })
  city?: City;
}
