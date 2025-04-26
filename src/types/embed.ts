export type CitySchools = {
  cityName: string;
  schools: School[];
};

export type School = { izo: string; name: string };

export type City = { code: number; name: string };
