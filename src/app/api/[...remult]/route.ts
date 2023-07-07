import { FounderController } from "@/controllers/FounderController";
import { Account } from "@/entities/Account";
import { City } from "@/entities/City";
import { CityDistrict } from "@/entities/CityDistrict";
import { County } from "@/entities/County";
import { Founder } from "@/entities/Founder";
import { Orp } from "@/entities/Orp";
import { Region } from "@/entities/Region";
import { School } from "@/entities/School";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { Role, User } from "@/entities/User";
import { createKnexDataProvider } from "remult/remult-knex";
import { remultNextApp } from "remult/remult-next";
import { getServerSessionWithOptions } from "../auth/[...nextauth]/route";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { configDotenv } from "dotenv";

configDotenv({ path: ".env.local" });

export const remultOptions = {
  entities: [
    Account,
    City,
    CityDistrict,
    County,
    Founder,
    Ordinance,
    OrdinanceMetadata,
    Orp,
    Region,
    School,
    SchoolFounder,
    StreetMarkdown,
    User,
  ],
  controllers: [FounderController],
  filename: "./" + process.env.TEXTTOMAP_SQLITE_PATH ?? "",
  dataProvider: createKnexDataProvider({
    client: "better-sqlite3",
    connection: {
      filename: "./" + process.env.TEXTTOMAP_SQLITE_PATH ?? "",
    },
    useNullAsDefault: true,
  }),
  getUser: async (req: Request) => {
    if (GlobalSettings.isBackendOnly) {
      return {
        id: "a1",
        name: "Admin",
        roles: [Role.Admin],
      };
    }
    const sessionUser = (await getServerSessionWithOptions())?.user;

    if (!sessionUser || !sessionUser.email) return undefined;

    return {
      id: sessionUser.id,
      name: sessionUser.name ?? undefined,
      roles: [sessionUser.role],
    };
  },
  // logApiEndPoints: true,
};

export const GlobalSettings = {
  isBackendOnly: false,
};

export const api = remultNextApp(remultOptions);

export const { GET, POST, PUT, DELETE } = api;
