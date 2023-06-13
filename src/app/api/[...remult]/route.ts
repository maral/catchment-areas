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
import { UserInfo } from "remult";
import { createKnexDataProvider } from "remult/remult-knex";
import { remultNextApp } from "remult/remult-next";
import { getServerSessionWithOptions } from "../auth/[...nextauth]/route";

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
    User,
    Account,
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
    console.log(await getServerSessionWithOptions());
    return  (await getServerSessionWithOptions())?.user as UserInfo
  }
  // logApiEndPoints: true,
});

export const { GET, POST, PUT, DELETE } = api;
