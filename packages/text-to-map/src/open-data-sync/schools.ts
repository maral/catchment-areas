import { createReadStream, createWriteStream, existsSync, rmSync } from "fs";
import fetch from "node-fetch";
import { join } from "path";
import parser from "stream-json";
import Pick from "stream-json/filters/Pick";
import StreamArray from "stream-json/streamers/StreamArray";

import { pipeline } from "stream/promises";
import { insertFounders } from "../db/founders";
import { insertSchools } from "../db/schools";
import { getKnexDb } from "../db/db";
import {
  Founder,
  MunicipalityType,
  School,
  SchoolLocation,
  SchoolType,
  SyncPart,
} from "../db/types";
import {
  OpenDataSyncOptions,
  OpenDataSyncOptionsPartial,
  prepareOptions,
} from "../utils/helpers";
import { runSyncPart } from "./common";
import { rewriteRenamedSchools, SchoolRename } from "./school-renames";

const downloadJsonld = async (options: OpenDataSyncOptions): Promise<void> => {
  if (existsSync(getJsonldFilePath(options))) {
    return;
  }

  console.log("Downloading a large JSON-LD file with school data...");
  const response = await fetch(options.schoolsJsonldUrl);
  if (response.status !== 200) {
    throw new Error(
      `The JSON-LD file could not be downloaded. HTTP Code: ${response.status}`
    );
  }
  await pipeline(response.body, createWriteStream(getJsonldFilePath(options)));
  console.log("Finished downloading.");
};

const normalizeName = (name: string): string => name.replace(/\s+/g, " ").trim();

/** Preference of a place of instruction as a school's location (lower first). */
const placeRank = (place: any, izo: string, seatRuian?: number): number =>
  place.IDmista === izo ? 0 : seatRuian != null && place.adresa.kodRUIAN === seatRuian ? 1 : 2;

const SCHOOL_TYPE_KINDERGARTEN = "A00";
const SCHOOL_TYPE_ELEMENTARY = "B00";

const getCorrectFounderType = (founderType: string): string => {
  return founderType === "" ? "101" : founderType;
};

const getMunicipalityType = (founderType: string): MunicipalityType => {
  return founderType === "261"
    ? MunicipalityType.City
    : founderType === "263"
    ? MunicipalityType.District
    : MunicipalityType.Other;
};

type SchoolAddress = {
  izo: string;
  address: string[];
  type: SchoolType;
};

const processSchoolRegisterJsonld = async (
  options: OpenDataSyncOptions
): Promise<{
  schools: School[];
  founders: Map<string, Founder>;
  schoolsWithoutRuian: SchoolAddress[];
  /** candidate address points per school IZO, best first */
  locationCandidates: Map<string, number[]>;
  /** the same places (and seat) as address text, best first */
  addressCandidates: Map<string, RegistryAddress[]>;
}> => {
  const founders = new Map<string, Founder>();
  const schools: School[] = [];
  const schoolsWithoutRuian: SchoolAddress[] = [];
  const locationCandidates = new Map<string, number[]>();
  const addressCandidates = new Map<string, RegistryAddress[]>();

  const stream = createReadStream(getJsonldFilePath(options))
    .pipe(parser())
    .pipe(new Pick({ filter: "list" }))
    .pipe(new StreamArray());

  for await (const { value: entity } of stream) {
    const redizo: string = entity.redIzo ?? "";
    const ico: string = entity.ico ?? "";
    // the registry has stray double and trailing spaces; a street-markdown line
    // has to match the name exactly, so it's normalized
    const entityName: string = normalizeName(entity.uplnyNazev ?? "");
    const currentSchools: School[] = [];

    for (const school of entity.skolyAZarizeni ?? []) {
      const type =
        school.druh === SCHOOL_TYPE_KINDERGARTEN
          ? SchoolType.Kindergarten
          : school.druh === SCHOOL_TYPE_ELEMENTARY
          ? SchoolType.Elementary
          : null;

      if (type === null) continue;

      const capacityEntry =
        school.kapacity?.find((k) => k.mernaJednotka === "01") ??
        school.kapacity?.[0];
      const capacity: number = capacityEntry?.nejvyssiPovolenyPocet ?? 0;
      const allPlaces = school.mistaVyuky ?? [];
      // Candidate address points, best first: the main building (IDmista
      // matches school IZO), the place at the entity's seat (sídlo), the other
      // places, then the seat itself — for a place the registry lists without
      // a RUIAN code (MŠ Turnov-Mašov) or with one RÚIAN doesn't have. The
      // first one we have an address point for is used, else the first
      // address found by its text (see resolveLocations).
      const seatRuian: number | undefined = entity.adresa?.kodRUIAN ?? undefined;
      const placeRuians = allPlaces
        .filter((p) => p.adresa?.kodRUIAN != null)
        .sort(
          (a, b) =>
            placeRank(a, school.izo, seatRuian) - placeRank(b, school.izo, seatRuian)
        )
        .map((p) => p.adresa.kodRUIAN as number);
      const candidates = [
        ...new Set([...placeRuians, ...(seatRuian != null ? [seatRuian] : [])]),
      ];
      locationCandidates.set(school.izo, candidates);
      // their addresses as text, for a RUIAN code RÚIAN doesn't have (an
      // outdated one: MŠ Litvínovská 490, Praha)
      addressCandidates.set(
        school.izo,
        [
          ...[...allPlaces].sort(
            (a, b) =>
              placeRank(a, school.izo, seatRuian) - placeRank(b, school.izo, seatRuian)
          ),
          { adresa: entity.adresa },
        ]
          .map((p) => p.adresa)
          .filter((a): a is RegistryAddress => a?.cisloDomovni != null)
      );
      if (candidates.length === 0 && allPlaces.length > 0) {
        const addr = allPlaces[0].adresa ?? {};
        const addressParts = [
          addr.ulice,
          addr.cisloDomovni?.toString(),
          addr.obec,
        ].filter(Boolean);
        schoolsWithoutRuian.push({ izo: school.izo, address: addressParts, type });
      }
      // resolved against the DB once every school is parsed
      const locations: SchoolLocation[] = [];

      currentSchools.push({
        izo: school.izo,
        name: entityName || normalizeName(school.uplnyNazev ?? ""),
        redizo,
        capacity,
        type,
        locations,
      });
    }

    schools.push(...currentSchools);

    for (const z of entity.zrizovatele ?? []) {
      let founderIco: string;
      let founderName: string;
      let founderType: string;

      if (z.druhOsoby === "PO") {
        founderIco = z.Ico ?? "";
        founderName = z.nazevOsoby ?? "";
        founderType = getCorrectFounderType(z.pravniForma ?? "");
      } else {
        founderIco = z.datumNarozeni ?? "";
        founderName = z.nazevOsoby ?? "";
        founderType = getCorrectFounderType("");
      }

      if (founderIco === "" || founderName === "") {
        founderIco = ico;
        founderName = entityName;
        founderType = "224";
      }

      if (currentSchools.length > 0) {
        const key = founderName + founderIco;
        if (founders.has(key)) {
          founders.get(key).schools.push(...currentSchools);
        } else {
          founders.set(key, {
            name: founderName,
            ico: founderIco,
            originalType: parseInt(founderType),
            municipalityType: getMunicipalityType(founderType),
            schools: [...currentSchools],
          });
        }
      }
    }
  }

  return { schools, founders, schoolsWithoutRuian, locationCandidates, addressCandidates };
};

/**
 * Give each school the first of its candidate address points that exists in
 * our RÚIAN data. Inserting one that doesn't would be dropped without a word
 * (MySQL `INSERT IGNORE` swallows the foreign-key error) — after the old
 * location was already deleted. Returns the schools left without any.
 */
const resolveLocations = async (
  schools: School[],
  locationCandidates: Map<string, number[]>,
  addressCandidates: Map<string, RegistryAddress[]>
): Promise<School[]> => {
  const knex = getKnexDb();
  const all = [...new Set([...locationCandidates.values()].flat())];
  const known = new Set<number>();
  for (let i = 0; i < all.length; i += 1000) {
    const rows = await knex("address_point")
      .whereIn("id", all.slice(i, i + 1000))
      .select("id");
    rows.forEach((r: { id: number }) => known.add(Number(r.id)));
  }
  const unresolved: School[] = [];
  for (const school of schools) {
    let id = (locationCandidates.get(school.izo) ?? []).find((c) => known.has(c));
    for (const address of addressCandidates.get(school.izo) ?? []) {
      if (id !== undefined) break;
      id = await findAddressPointByText(address);
    }
    school.locations = id === undefined ? [] : [{ addressPointId: id }];
    if (id === undefined) unresolved.push(school);
  }
  return unresolved;
};

/** An address as the school registry gives it. */
interface RegistryAddress {
  ulice?: string | null;
  cisloDomovni?: number | null;
  cisloOrientacni?: number | null;
  dodatekOrientacnihoCisla?: string | null;
  obec?: string | null;
  castObce?: string | null;
}

/**
 * The one address point matching an address by its text — street (or none),
 * č.p., č.o. and the municipality part or the municipality; undefined when
 * there's no match or several.
 */
const findAddressPointByText = async (
  address: RegistryAddress
): Promise<number | undefined> => {
  let query = getKnexDb()("address_point as ap")
    .leftJoin("street as s", "s.code", "ap.street_code")
    .join("city as c", "c.code", "ap.city_code")
    .leftJoin("municipality_part as mp", "mp.code", "ap.municipality_part_code")
    .where("ap.descriptive_number", address.cisloDomovni);
  query = address.ulice
    ? query.where("s.name", address.ulice)
    : query.whereNull("ap.street_code");
  if (address.cisloOrientacni != null) {
    query = query.where("ap.orientational_number", address.cisloOrientacni);
    query = address.dodatekOrientacnihoCisla
      ? query.where("ap.orientational_number_letter", address.dodatekOrientacnihoCisla)
      : query.whereNull("ap.orientational_number_letter");
  }
  // the registry's municipality part can differ from RÚIAN's (Litvínovská
  // 490/52: Střížkov vs. Prosek), so either it or the municipality will do
  query = query.where((q) =>
    q.where("mp.name", address.castObce ?? "").orWhere("c.name", address.obec ?? "")
  );
  const rows = await query.limit(2).select("ap.id");
  return rows.length === 1 ? Number(rows[0].id) : undefined;
};

const importDataToDb = async (
  options: OpenDataSyncOptions,
  saveFoundersToCsv: boolean = false,
  saveSchoolsWithoutRuianToCsv: boolean = false
) => {
  const { schools, founders, schoolsWithoutRuian, locationCandidates, addressCandidates } =
    await processSchoolRegisterJsonld(options);
  const withoutLocation = await resolveLocations(
    schools,
    locationCandidates,
    addressCandidates
  );

  if (saveFoundersToCsv) {
    const csvFile = "founders.csv";

    if (existsSync(csvFile)) {
      rmSync(csvFile);
    }

    var csv = createWriteStream(csvFile, {
      flags: "a",
    });
    csv.write("IČO;Zřizovatel;Právní forma;Počet škol;Školy\n");
    founders.forEach((founder) => {
      csv.write(
        `#${founder.ico};${founder.name};${founder.originalType};${
          founder.schools.length
        };${founder.schools.map((school) => school.name).join("---")}\n`
      );
    });
    csv.end();
  }

  if (saveSchoolsWithoutRuianToCsv) {
    const csvFile = "schoolsWithoutRuian.csv";

    if (existsSync(csvFile)) {
      rmSync(csvFile);
    }

    var csv = createWriteStream(csvFile, {
      flags: "a",
    });
    csv.write("IZO;Je mateřská;Je základní;adresa1;adresa2;adresa3\n");
    schoolsWithoutRuian.forEach((schoolAddress) => {
      csv.write(
        `#${schoolAddress.izo};${
          schoolAddress.type === SchoolType.Kindergarten ? "TRUE" : "FALSE"
        };${
          schoolAddress.type === SchoolType.Elementary ? "TRUE" : "FALSE"
        };${schoolAddress.address.join(";")}\n`
      );
    });
    csv.end();
  }

  const knex = getKnexDb();
  const schoolsBefore = (await knex("school").count("izo as count").first()).count as number;
  const foundersBefore = (await knex("founder").count("id as count").first()).count as number;

  // Compute change stats before inserting (uses same logic as insertSchools)
  const existingSnap: { izo: string; name: string; capacity: number; address_point_id: number | null }[] =
    await knex("school")
      .leftJoin("school_location", "school.izo", "school_location.school_izo")
      .select("school.izo", "school.name", "school.capacity", "school_location.address_point_id");
  const existingSnapMap = new Map(existingSnap.map((r) => [r.izo, r]));
  const statsFieldUpdates = schools.filter((s) => {
    const row = existingSnapMap.get(s.izo);
    return row && (row.name !== s.name || row.capacity !== s.capacity);
  }).length;
  const statsLocationUpdates = schools.filter((s) => {
    const row = existingSnapMap.get(s.izo);
    const newRuians = s.locations.map((l) => l.addressPointId);
    return row && row.address_point_id !== null && newRuians.length > 0 && !newRuians.includes(row.address_point_id);
  }).length;

  const renames = new Map<string, SchoolRename>();
  for (const s of schools) {
    const row = existingSnapMap.get(s.izo);
    if (row && row.name && s.name && row.name !== s.name) {
      renames.set(s.izo, { izo: s.izo, type: s.type, oldName: row.name, newName: s.name });
    }
  }

  await insertSchools(schools);
  await insertFounders(Array.from(founders.values()));
  const renameResult = await rewriteRenamedSchools([...renames.values()]);

  const schoolsAfter = (await knex("school").count("izo as count").first()).count as number;
  const foundersAfter = (await knex("founder").count("id as count").first()).count as number;

  const kindergartens = schools.filter((s) => s.type === SchoolType.Kindergarten).length;
  const elementary = schools.filter((s) => s.type === SchoolType.Elementary).length;

  console.log(`\n=== School sync statistics ===`);
  console.log(`Schools parsed:         ${schools.length} (${kindergartens} kindergartens, ${elementary} elementary)`);
  console.log(`Founders parsed:        ${founders.size}`);
  console.log(`New schools inserted:   ${schoolsAfter - schoolsBefore}`);
  console.log(`New founders inserted:  ${foundersAfter - foundersBefore}`);
  console.log(`Field updates:          ${statsFieldUpdates} (name/capacity changed)`);
  console.log(`Location updates:       ${statsLocationUpdates} (first location changed)`);
  console.log(`Without location:       ${withoutLocation.length} (no usable RUIAN code in the registry)`);
  for (const s of withoutLocation) {
    console.log(`  ${s.izo} ${s.name}`);
  }
  console.log(`Renamed schools:        ${renames.size}`);
  console.log(`Street markdowns fixed: ${renameResult.rewritten.length} (${renameResult.rewritten.reduce((n, r) => n + r.lines, 0)} lines)`);
  console.log(`Cached maps dropped:    ${renameResult.mapDataDeleted}`);
  for (const r of renameResult.ambiguous) {
    console.log(`  not rewritten (old name still another school's): ${r.izo} "${r.oldName}" -> "${r.newName}"`);
  }
  console.log(`Total schools in DB:    ${schoolsAfter}`);
  console.log(`Total founders in DB:   ${foundersAfter}`);
};

const getJsonldFilePath = (options: OpenDataSyncOptionsPartial): string => {
  return join(options.tmpDir, options.schoolsJsonldFileName);
};

export const downloadAndImportSchools = async (
  options: OpenDataSyncOptionsPartial = {},
  saveFoundersToCsv: boolean = false,
  saveSchoolsWithoutRuianToCsv: boolean = false
) => {
  await runSyncPart(SyncPart.Schools, [SyncPart.AddressPoints], async () => {
    const runOptions = prepareOptions(options);

    await downloadJsonld(runOptions);
    await importDataToDb(
      runOptions,
      saveFoundersToCsv,
      saveSchoolsWithoutRuianToCsv
    );
    deleteSchoolsJsonldFile(runOptions);
  });
};

export const deleteSchoolsJsonldFile = (
  options: OpenDataSyncOptionsPartial = {}
) => {
  const runOptions = prepareOptions(options);

  if (existsSync(getJsonldFilePath(runOptions))) {
    rmSync(getJsonldFilePath(runOptions));
  }
};
