import { point, polygon } from "@turf/helpers";
import { getObecBoundary, interiorPoint } from "../street-markdown/polygons";
import { PolygonsByCodes } from "../db/types";
import {
  MigDefBodKo,
  MigrationExport,
  MigSkolskyOkrsek,
  MigSkoKo,
  SchoolTypeCode,
} from "./types";

/**
 * ČÚZK Q-overlap (`SKO_MIGRATION_PLAN.md` §1, §8): ISÚI takes at most one
 * MIG_VYMEZENI_ZBYLYCH_KO row per obec + type. A village absorbed whole by
 * several same-type ŠO (a town's schools sharing a free-choice catchment)
 * yields one row per ŠO, so that type is defined explicitly instead: one
 * okrsek per part of the obec polygon, each with an interior def point and no
 * seams (its outline is the obec boundary itself), linked to every one of the
 * overlapping ŠO. Its rows are dropped; the obec's other types keep theirs.
 *
 * CISLO continues after the obec's existing okrsky (unique across types).
 */
export const explicitOverlappingVymezeni = (
  data: MigrationExport,
  cityPolygons: PolygonsByCodes,
  allocOkrsekKod: () => number,
  allocId: () => number
): MigrationExport => {
  const obvodType = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
  const skoByObecType = new Map<
    string,
    { obecKod: number; typeCode: SchoolTypeCode; skoKods: Set<number> }
  >();
  for (const v of data.vymezeni) {
    if (v.SKO_KOD === null) continue;
    const typeCode = obvodType.get(v.SKO_KOD);
    if (!typeCode) continue;
    const key = `${v.OBEC_KOD}/${typeCode}`;
    const group = skoByObecType.get(key) ?? {
      obecKod: v.OBEC_KOD,
      typeCode,
      skoKods: new Set<number>(),
    };
    group.skoKods.add(v.SKO_KOD);
    skoByObecType.set(key, group);
  }
  const overlapping = [...skoByObecType.entries()]
    .filter(([, g]) => g.skoKods.size > 1)
    .sort(
      ([, a], [, b]) =>
        a.obecKod - b.obecKod || a.typeCode.localeCompare(b.typeCode)
    );
  if (overlapping.length === 0) return data;

  const nextCislo = new Map<number, number>();
  for (const o of data.okrsky) {
    nextCislo.set(o.OBEC_KOD, Math.max(nextCislo.get(o.OBEC_KOD) ?? 1, o.CISLO + 1));
  }

  const okrsky: MigSkolskyOkrsek[] = [];
  const skoKo: MigSkoKo[] = [];
  const defBody: MigDefBodKo[] = [];
  for (const [, { obecKod, typeCode, skoKods }] of overlapping) {
    const boundary = getObecBoundary(cityPolygons, obecKod);
    if (!boundary) {
      throw new Error(
        `No boundary polygon found for obec ${obecKod}. Is the DB synced?`
      );
    }
    const parts =
      boundary.geometry.type === "Polygon"
        ? [boundary.geometry.coordinates]
        : boundary.geometry.coordinates;
    for (const part of parts) {
      const kod = allocOkrsekKod();
      const cislo = nextCislo.get(obecKod) ?? 1;
      nextCislo.set(obecKod, cislo + 1);
      okrsky.push({
        KOD: kod,
        KOD_ISUI: null,
        NAZEV: null,
        CISLO: cislo,
        POZNAMKA: null,
        OBEC_KOD: obecKod,
        TYP_OBVODU_KOD: typeCode,
      });
      defBody.push({
        ID: allocId(),
        KO_KOD: kod,
        geometry: point(interiorPoint(polygon(part))).geometry,
      });
      for (const skoKod of [...skoKods].sort((a, b) => a - b)) {
        skoKo.push({ SKO_KOD: skoKod, KO_KOD: kod });
      }
    }
  }

  const converted = new Set(overlapping.map(([key]) => key));
  return {
    ...data,
    okrsky: [...data.okrsky, ...okrsky],
    skoKo: [...data.skoKo, ...skoKo],
    defBody: [...data.defBody, ...defBody],
    vymezeni: data.vymezeni.filter(
      (v) =>
        v.SKO_KOD === null ||
        !converted.has(`${v.OBEC_KOD}/${obvodType.get(v.SKO_KOD)}`)
    ),
  };
};
