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
import { RemultNextAppServer, remultNextApp } from "remult/remult-next";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { configDotenv } from "dotenv";
import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { RemultServerOptions } from "remult/server";
import { Remult } from "remult";
import { getServerSessionWithOptions } from "../auth/[...nextauth]/config";
import { StreetController } from "@/controllers/StreetController";

configDotenv({ path: ".env.local" });

let remultOptions: RemultServerOptions<any> | null = null;

export function getRemultOptions(
  isBackendOnly: boolean = false
): RemultServerOptions<any> {
  console.log(`TEXTTOMAP_SQLITE_PATH: '${process.env.TEXTTOMAP_SQLITE_PATH}'`);
  if (remultOptions === null) {
    remultOptions = {
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
      controllers: [
        FounderController,
        StreetMarkdownController,
        StreetController,
      ],
      dataProvider: createKnexDataProvider({
        client: "better-sqlite3",
        connection: {
          filename: "./" + process.env.TEXTTOMAP_SQLITE_PATH ?? "",
        },
        useNullAsDefault: true,
        // debug: true,
      }),
      getUser: async () => {
        if (isBackendOnly) {
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
  }
  return remultOptions;
}

let remultApi: RemultNextAppServer | null = null;

export function getRemultAPI(
  isBackendOnly: boolean = false
): RemultNextAppServer {
  if (remultApi === null) {
    remultApi = remultNextApp(getRemultOptions(isBackendOnly));
  }
  return remultApi;
}

let remult: Remult | null = null;

export const getRemult = async (): Promise<Remult> => {
  if (remult === null) {
    // @ts-ignore
    remult = await getRemultAPI().getRemult({});
  }
  return remult;
};
