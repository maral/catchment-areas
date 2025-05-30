import { SchoolType } from "@/types/basicTypes";

export type CitySchools = {
  cityName: string;
  cityCode: number;
  schools: School[];
};

export type School = { izo: string; name: string; type: SchoolType };

export type City = { code: number; name: string };
