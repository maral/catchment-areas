import { Account } from "@/entities/Account";
import { City } from "@/entities/City";
import { CityDistrict } from "@/entities/CityDistrict";
import { County } from "@/entities/County";
import { Founder } from "@/entities/Founder";
import { Orp } from "@/entities/Orp";
import { Region } from "@/entities/Region";
import { School } from "@/entities/School";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { User } from "@/entities/User";
import { createKnexDataProvider } from "remult/remult-knex";
import { remultNextApp } from "remult/remult-next";
import { getServerSessionWithOptions } from "../auth/[...nextauth]/route";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";

export const api = remultNextApp({
  entities: [
    Account,
    City,
    CityDistrict,
    County,
    Founder,
    Ordinance,
    Orp,
    Region,
    School,
    SchoolFounder,
    StreetMarkdown,
    User,

  ],
  dataProvider: createKnexDataProvider({
    client: "sqlite3",
    connection: {
      filename: "./data/address_points.db",
    },
    useNullAsDefault: true,
    // debug: true,
  }),
  getUser: async (req) => {
    const sessionUser = (await getServerSessionWithOptions())?.user;

    if (!sessionUser || !sessionUser.email) return undefined;

    return {
      id: sessionUser.id,
      name: sessionUser.name ?? undefined,
      roles: [sessionUser.role],
    };
  },
  // logApiEndPoints: true,
});

export const { GET, POST, PUT, DELETE } = api;
