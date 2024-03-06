import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { load } from "cheerio";
import { Workbook } from "exceljs";
import chunk from "lodash/chunk";
import fetch from "node-fetch";
import { dbNamesOf, remult } from "remult";
import { KnexDataProvider } from "remult/remult-knex";

const XLSX_EXPORT_URL =
  "https://sbirkapp.gov.cz/vyhledavani/vysledek?format_exportu=xlsx&nazev=&number=&ovm=&platnost=&typ=ozv&ucinnost_do=&ucinnost_od=&znacka=&oblast=skolske-obvody-zakladni-skoly";

export interface ParsedOrdinanceMetadata {
  id: string;
  name: string;
  number: string;
  city: string;
  region: string;
  publishedAt: string;
  validFrom: string;
  validTo?: string;
  approvedAt: string;
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
          id: row.getCell(1).value as string,
          name: row.getCell(2).value as string,
          number: row.getCell(4).value as string,
          city: row.getCell(5).value as string,
          region: row.getCell(8).value as string,
          publishedAt: row.getCell(9).value as string,
          validFrom: row.getCell(10).value as string,
          approvedAt: row.getCell(11).value as string,
          version: row.getCell(16).value as number,
          isValid: row.getCell(17).value as boolean,
          validTo: row.getCell(18).value
            ? (row.getCell(18).value as string)
            : undefined,
        };
      }) ?? null
    );
  }
  return null;
}

function convertDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }
  return new Date(dateString);
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
