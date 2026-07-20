import { Repository, remult } from "remult";

/**
 * Serializes an entity to JSON, re-including reference (ManyToOne) relations
 * that remult's `repo.toJson()` drops.
 *
 * Background: remult 0.22.8 added a guard to `LookupColumn.toJson()` that makes
 * a *loaded* reference field serialize as `undefined` (dropping the key), unless
 * the reference was assigned as a plain object. This broke SSR round-trips where
 * a server component loads an entity, serializes it with `toJson()`, and a client
 * component reads a relation off it (e.g. `ordinance.city.code`). Neither `load`
 * nor `include` restores it, and the behavior persists through remult 3.x.
 *
 * This helper re-serializes the named relations explicitly, reproducing the
 * pre-0.22.8 output while staying on the current remult version. The relations
 * must already be loaded on `item` (non-lazy references are loaded by default;
 * lazy ones need an explicit `load`/`include` when querying).
 */
export function toJsonWithRelations<T>(
  repo: Repository<T>,
  item: T,
  relations: (keyof T)[]
): any {
  const json = repo.toJson(item);
  for (const key of relations) {
    // If the current remult already serialized it, leave it untouched.
    if (json[key as string] !== undefined) continue;

    const related = (item as any)[key];
    if (related === null || related === undefined) {
      json[key as string] = related ?? null;
      continue;
    }

    json[key as string] = remult.repo(related.constructor).toJson(related);
  }
  return json;
}

/** Array variant of {@link toJsonWithRelations}. */
export function toJsonArrayWithRelations<T>(
  repo: Repository<T>,
  items: T[],
  relations: (keyof T)[]
): any[] {
  return items.map((item) => toJsonWithRelations(repo, item, relations));
}
