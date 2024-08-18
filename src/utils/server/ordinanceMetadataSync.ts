import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { load } from "cheerio";
import { Cell, Workbook } from "exceljs";
import chunk from "lodash/chunk";
import fetch from "node-fetch";
import { dbNamesOf, remult } from "remult";
import { KnexDataProvider } from "remult/remult-knex";

const XLSX_EXPORT_URL =
  "https://sbirkapp.gov.cz/vyhledavani/vysledek?format_exportu=xlsx&hlavni_typ=pp&nazev=&number=&oblast=skolske-obvody-zakladni-skoly&ovm=&platnost=&typ=ozv&ucinnost_do=&ucinnost_od=&vydano_do=&vydano_od=&zverejneno_do=&zverejneno_od=";

export interface ParsedOrdinanceMetadata {
  id: string;
  name: string;
  number: string;
  city: string;
  region: string;
  publishedAt?: string;
  validFrom?: string;
  validTo?: string;
  approvedAt?: string;
  version: number;
  isValid: boolean;
}

export function getOrdinanceDocumentDownloadLink(ordinanceMetadataId: string) {
  return `https://sbirkapp.gov.cz/detail/${ordinanceMetadataId}/text`;
}

async function findLink(
  url: string,
  attempts: number,
  delay: number
): Promise<string | null> {
  const fullUrl = "https://sbirkapp.gov.cz";
  for (let i = 0; i < attempts; i++) {
    console.log(`Attempt ${i + 1} of ${attempts} for download link retrieval.`);
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      const $ = load(html);
      const linkElement = $("div.gov-content-block > a").filter(
        (_, el) => $(el).text().trim() === "Výsledek"
      );
      const link = linkElement.attr("href");
      if (link) {
        console.log("Attempt successful, found a download link.");
        return fullUrl + link;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return null;
}

type ExcelLink = {
  text: string;
  hyperlink: string;
};

async function downloadAndReadXLSX(
  url: string
): Promise<ParsedOrdinanceMetadata[] | null> {
  const response = await fetch(url);

  const data = await response.arrayBuffer();

  const workbook = new Workbook();
  await workbook.xlsx.load(data);

  if (workbook && workbook.worksheets && workbook.worksheets[0]) {
    const worksheet = workbook.worksheets[0];
    const rows = worksheet.getRows(2, worksheet.rowCount - 1);

    return (
      rows?.map((row) => {
        return {
          id: getCodeFromUrl(row.getCell(21).value as ExcelLink),
          name: row.getCell(7).value as string,
          number: row.getCell(5).value as string,
          city: row.getCell(1).value as string,
          region: row.getCell(4).value as string,
          publishedAt: stringOrUndefined(row.getCell(12)),
          validFrom: stringOrUndefined(row.getCell(10)),
          approvedAt: stringOrUndefined(row.getCell(8)),
          version: row.getCell(23).value as number,
          isValid: row.getCell(19).value as boolean,
          validTo: stringOrUndefined(row.getCell(20)),
        };
      }) ?? null
    );
  }
  return null;
}

function stringOrUndefined(cell: Cell): string | undefined {
  return cell.value ? (cell.value as string) : undefined;
}

function getCodeFromUrl(url: ExcelLink): string {
  const regex = /\/detail\/([A-Z0-9]+)$/;
  const match = url.hyperlink.match(regex);

  if (!match) {
    throw new Error("Invalid URL format.");
  }

  return match[1];
}

function convertDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }
  const timestamp = Date.parse(dateString);

  if (isNaN(timestamp) === false) {
    return new Date(timestamp);
  }

  if (dateString.includes(";")) {
    const timestamp2 = Date.parse(dateString.split(";")[0]);
    if (isNaN(timestamp2) === false) {
      return new Date(timestamp2);
    }
  }

  return undefined;
}

export async function syncOrdinancesToDb() {
  const url = await findLink(XLSX_EXPORT_URL, 10, 5000);

  if (!url) {
    console.log("No link found!");
    return;
  }

  const downloadedOrdinances = await downloadAndReadXLSX(url);

  if (!downloadedOrdinances) {
    console.log("No ordinances found in the downloaded file!");
    return;
  }

  const ordinanceMetadata = await dbNamesOf(OrdinanceMetadata);
  const knex = KnexDataProvider.getDb();
  const existingIds: string[] = await knex
    .pluck(ordinanceMetadata.id)
    .from(ordinanceMetadata.toString());

  const newOrdinances = downloadedOrdinances.filter(
    (o) => !existingIds.includes(o.id)
  );

  console.log(`Found ${newOrdinances.length} new ordinances.`);

  await getAdminRemultAPI().withRemult(async () => {
    const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
    const chunks = chunk(newOrdinances, 200);
    for (const chunk of chunks) {
      await ordinanceMetadataRepo.insert(
        chunk.map((o) => ({
          id: o.id,
          name: o.name.substring(0, 100),
          number: o.number,
          city: o.city,
          region: o.region,
          publishedAt: convertDate(o.publishedAt),
          validFrom: convertDate(o.validFrom),
          validTo: convertDate(o.validTo),
          approvedAt: convertDate(o.approvedAt),
          version: o.version,
          isValid: o.isValid,
        }))
      );
    }
  });

  // const chunks = chunk(newOrdinances, 200);
  // for (const chunk of chunks) {
  //   await knex(ordinanceMetadata.toString()).insert(
  //     chunk.map((o) => ({
  //       [ordinanceMetadata.id]: o.id,
  //       [ordinanceMetadata.name]: o.name,
  //       [ordinanceMetadata.number]: o.number,
  //       [ordinanceMetadata.city]: o.city,
  //       [ordinanceMetadata.region]: o.region,
  //       [ordinanceMetadata.publishedAt]: o.publishedAt,
  //       [ordinanceMetadata.validFrom]: o.validFrom,
  //       [ordinanceMetadata.validTo]: o.validTo,
  //       [ordinanceMetadata.approvedAt]: o.approvedAt,
  //       [ordinanceMetadata.version]: o.version,
  //       [ordinanceMetadata.isValid]: o.isValid,
  //     }))
  //   );
  // }

  await KnexDataProvider.getDb().destroy();
}
