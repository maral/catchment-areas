import { City } from "./embed";

export interface AnalyticsCityRow {
  city_code: number;
  city_name: string;
  social_exclusion_index: number | null;
  population_density: number | null;
  early_school_leavers: number | null;
  school_count: string; // Knex returns COUNT as string
}
export interface AnalyticsCityData {
  city: City;
  socialExclusionIndex: { count: number } | null;
  populationDensity: { count: number } | null;
  earlySchoolLeavers: { count: number } | null;
  schoolCount: number;
}
