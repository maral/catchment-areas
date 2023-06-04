import { Region } from "@/entities/Region";
import { County } from "@/entities/County";
import { remultNextApp } from "remult/remult-next";
import { createKnexDataProvider } from "remult/remult-knex";

export const api = remultNextApp({
  entities: [Region, County],
  dataProvider: createKnexDataProvider({
    client: "sqlite3",
    connection: {
      filename: "./data/address_points.db"
    },
    useNullAsDefault: true,
  }),
});

export const { GET, POST, PUT, DELETE } = api;
