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
import { OrdinanceController } from "@/controllers/OrdinanceController";

configDotenv({ path: ".env.local" });

let remultOptions: RemultServerOptions<any> | null = null;

export function getRemultOptions(
  isBackendOnly: boolean = false
): RemultServerOptions<any> {
  if (remultOptions === null) {
    if (!process.env.TEXTTOMAP_MYSQL_CONNECTION_DATA) {
      throw new Error("Missing TEXTTOMAP_MYSQL_CONNECTION_DATA env variable!");
    }
    const [host, port, user, password, database] =
      process.env.TEXTTOMAP_MYSQL_CONNECTION_DATA.split(":");
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
        OrdinanceController,
      ],
      dataProvider: createKnexDataProvider({
        client: "mysql",
        pool: {
          idleTimeoutMillis: 120000,
        },
        //   min: 0,
        //   max: 10,
        //   afterCreate: (conn: any, done: any) => {
        //     console.log("AFTER CREATE");
        //   },
        // },
        connection: {
          host,
          port: Number(port),
          user,
          password,
          database,
        },
        // client: "better-sqlite3",
        // connection: {
        //   filename: "./" + process.env.TEXTTOMAP_SQLITE_PATH ?? "",
        // },
        useNullAsDefault: true,
        // debug: true,
      }),
      ensureSchema: false,
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

export function getNormalRemultAPI(): RemultNextAppServer {
  if (remultApi === null) {
    remultApi = remultNextApp(getRemultOptions(false));
  }
  return remultApi;
}

export function getAdminRemultAPI(): RemultNextAppServer {
  if (remultApi === null) {
    remultApi = remultNextApp(getRemultOptions(true));
  }
  return remultApi;
}

let remult: Remult | null = null;

export const getRemult = async (): Promise<Remult> => {
  if (remult === null) {
    // @ts-ignore
    remult = await getNormalRemultAPI().getRemult({});
  }
  return remult;
};
