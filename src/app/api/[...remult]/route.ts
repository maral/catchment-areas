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
import { RemultServerOptions } from "remult/server";
import { getServerSessionWithOptions } from "../auth/[...nextauth]/route";

export const remultOptions = {
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
  getUser: async (req: Request) => {
    const sessionUser = (await getServerSessionWithOptions())?.user;

    if (!sessionUser || !sessionUser.email) return undefined;

    return {
      id: sessionUser.id,
      name: sessionUser.name ?? undefined,
      roles: [sessionUser.role],
    };
  },
  // logApiEndPoints: true,
}

export const api = remultNextApp(remultOptions);

export const { GET, POST, PUT, DELETE } = api;
