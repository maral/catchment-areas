import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { load } from "cheerio";
import { Workbook } from "exceljs";
import fetch from "node-fetch";
import { dbNamesOf } from "remult";
import { KnexDataProvider } from "remult/remult-knex";
import chunk from "lodash/chunk";

const XLSX_EXPORT_URL =
  "https://sbirkapp.gov.cz/vyhledavani/vysledek?format_exportu=xlsx&nazev=&number=&ovm=&platnost=&typ=ozv&ucinnost_do=&ucinnost_od=&znacka=&oblast=skolske-obvody-zakladni-skoly";

export interface ParsedOrdinanceMetadata {
  id: string;
  name: string;
  number: string;
  city: string;
  region: string;
  publishedAt: Date;
  validFrom: Date;
  validTo?: Date;
  approvedAt: Date;
  version: number;
  isValid: boolean;
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

async function downloadAndReadXLSX(
  url: string
): Promise<ParsedOrdinanceMetadata[] | null> {
  const response = await fetch(url);

  const data = await response.arrayBuffer();

  const workbook = new Workbook();
  await workbook.xlsx.load(data);

  if (workbook && workbook.worksheets && workbook.worksheets[0]) {
    const worksheet = workbook.worksheets[0];
    const rows = worksheet.getRows(1, worksheet.rowCount);
    return (
      rows?.map((row) => {
        return {
          id: row.getCell(1).value as string,
          name: row.getCell(2).value as string,
          number: row.getCell(4).value as string,
          city: row.getCell(5).value as string,
          region: row.getCell(8).value as string,
          publishedAt: row.getCell(9).value as Date,
          validFrom: row.getCell(10).value as Date,
          approvedAt: row.getCell(11).value as Date,
          version: row.getCell(16).value as number,
          isValid: row.getCell(17).value as boolean,
          validTo: row.getCell(10).value
            ? (row.getCell(10).value as Date)
            : undefined,
        };
      }) ?? null
    );
  }
  return null;
}

export async function syncOrdinancesToDb() {
  const url = await findLink(XLSX_EXPORT_URL, 5, 5000);

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

  const chunks = chunk(newOrdinances, 200);
  for (const chunk of chunks) {
    await knex(ordinanceMetadata.toString()).insert(
      chunk.map((o) => ({
        [ordinanceMetadata.id]: o.id,
        [ordinanceMetadata.name]: o.name,
        [ordinanceMetadata.number]: o.number,
        [ordinanceMetadata.city]: o.city,
        [ordinanceMetadata.region]: o.region,
        [ordinanceMetadata.publishedAt]: o.publishedAt,
        [ordinanceMetadata.validFrom]: o.validFrom,
        [ordinanceMetadata.validTo]: o.validTo,
        [ordinanceMetadata.approvedAt]: o.approvedAt,
        [ordinanceMetadata.version]: o.version,
        [ordinanceMetadata.isValid]: o.isValid,
      }))
    );
  }

  await KnexDataProvider.getDb().destroy();
}