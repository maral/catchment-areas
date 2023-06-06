import { Region } from "@/entities/Region";
import { County } from "@/entities/County";
import { remultNextApp } from "remult/remult-next";
import { createKnexDataProvider } from "remult/remult-knex";
import { City } from "@/entities/City";
import { CityDistrict } from "@/entities/CityDistrict";
import { Founder } from "@/entities/Founder";
import { Orp } from "@/entities/Orp";
import { School } from "@/entities/School";
import { SchoolFounder } from "@/entities/SchoolFounder";

export const api = remultNextApp({
  entities: [
    City,
    CityDistrict,
    County,
    Founder,
    Orp,
    Region,
    School,
    SchoolFounder,
  ],
  dataProvider: createKnexDataProvider({
    client: "sqlite3",
    connection: {
      filename: "./data/address_points.db",
    },
    useNullAsDefault: true,
  }),
  logApiEndPoints: true,
});

export const { GET, POST, PUT, DELETE } = api;
