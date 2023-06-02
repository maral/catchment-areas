import { Region } from "@/entities/Region";
import { remultNextApp } from "remult/remult-next";
import { createKnexDataProvider } from "remult/remult-knex";

export const api = remultNextApp({
  entities: [Region],
  dataProvider: createKnexDataProvider({
    client: "sqlite3",
    connection: {
      filename: "./data/address_points.db"
    },
  }),
});

export const { GET, POST, PUT, DELETE } = api;
