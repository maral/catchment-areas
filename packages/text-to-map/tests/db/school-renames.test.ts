import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import {
  commitAddressPoints,
  insertCities,
  insertDistricts,
  insertStreets,
} from "../../src/db/address-points";
import { getKnexDb } from "../../src/db/db";
import { insertFounders } from "../../src/db/founders";
import { insertSchools } from "../../src/db/schools";
import { findActiveSchoolNameIssues } from "../../src/db/street-markdowns";
import { SchoolType } from "../../src/db/types";
import { rewriteRenamedSchools } from "../../src/open-data-sync/school-renames";
import { closeDb, setupDb, testFounders, testRows, testSchools } from "./db-setup";

const prefix = "school-renames";
const [school, otherSchool] = testSchools;
const oldName = school.name;
const newName = "Církevní základní škola Přemysla Pittra, příspěvková organizace";
let founderId = 0;

const smdText = (name: string) =>
  ["! komentář", `  ${name}`, "Lysá", "", otherSchool.name, "Paseky"].join("\n");

const latestText = async (ordinanceId: number) =>
  (
    await getKnexDb()("street_markdown")
      .where({ ordinance_id: ordinanceId })
      .orderBy("id", "desc")
      .first()
  ).source_text;

beforeAll(async () => {
  const knex = await setupDb(prefix);
  await insertCities(testRows);
  await insertDistricts(testRows);
  await insertStreets(testRows);
  await commitAddressPoints(testRows);
  await insertSchools(testSchools);
  await insertFounders(testFounders);
  founderId = (await knex("founder").first("id")).id;

  // the app's tables, as far as the rename touches them
  await knex.schema.createTable("ordinance", (t) => {
    t.increments("id");
    t.integer("city_code");
    t.integer("school_type");
    t.string("valid_from");
    t.string("valid_to").nullable();
    t.boolean("is_active");
    t.string("external_data").nullable();
  });
  await knex.schema.createTable("street_markdown", (t) => {
    t.increments("id");
    t.string("user_id");
    t.integer("ordinance_id");
    t.integer("founder_id");
    t.string("state");
    t.dateTime("created_at");
    t.text("comment");
    t.text("source_text");
  });
  await knex.schema.createTable("map_data", (t) => {
    t.increments("id");
    t.integer("ordinance_id");
    t.integer("city_code");
    t.text("json_data");
  });

  await knex("ordinance").insert([
    { id: 1, city_code: 500011, school_type: SchoolType.Elementary, valid_from: "2024-01-01", valid_to: null, is_active: true },
    { id: 2, city_code: 500011, school_type: SchoolType.Elementary, valid_from: "2019-01-01", valid_to: "2020-12-31", is_active: false },
  ]);
  const smd = (ordinance_id: number, created_at: Date, source_text: string) => ({
    user_id: "editor-1",
    ordinance_id,
    founder_id: founderId,
    state: '"auto-save"',
    created_at,
    comment: "",
    source_text,
  });
  await knex("street_markdown").insert([
    smd(1, new Date("2024-01-01"), "older version"),
    smd(1, new Date("2024-02-01"), smdText(oldName)),
    smd(2, new Date("2019-02-01"), smdText(oldName)),
  ]);
  await knex("map_data").insert([
    { ordinance_id: 1, city_code: 500011, json_data: JSON.stringify([{ areas: [{ schools: [{ izo: school.izo, name: oldName }] }] }]) },
    { ordinance_id: 3, city_code: 500012, json_data: JSON.stringify([{ areas: [{ schools: [{ izo: "1", name: "x" }] }] }]) },
  ]);
});

afterAll(async () => {
  await closeDb(prefix);
});

describe("rewriteRenamedSchools", () => {
  test("a renamed school's old name is an issue in the active ordinance", async () => {
    await getKnexDb()("school").where({ izo: school.izo }).update({ name: newName });
    const issues = await findActiveSchoolNameIssues(SchoolType.Elementary);
    expect(issues.map((i) => i.issues.map((l) => [l.lineNumber, l.line]))).toEqual([
      [[2, oldName]],
    ]);
  });

  test("rewrites the current version of still-valid ordinances and drops cached maps", async () => {
    const result = await rewriteRenamedSchools([
      { izo: school.izo, type: SchoolType.Elementary, oldName, newName },
    ]);
    expect(result.rewritten).toEqual([{ founderId, ordinanceId: 1, lines: 1 }]);
    expect(result.ambiguous).toEqual([]);
    expect(result.mapDataDeleted).toBe(1);

    expect(await latestText(1)).toBe(smdText(newName)); // indentation kept
    expect(await latestText(2)).toBe(smdText(oldName)); // expired: left alone
    const saved = await getKnexDb()("street_markdown").orderBy("id", "desc").first();
    expect(saved).toMatchObject({ user_id: "editor-1", state: '"auto-save"' });
    expect(saved.comment).toContain(`„${oldName}“ → „${newName}“`);
    expect(await getKnexDb()("map_data").pluck("ordinance_id")).toEqual([3]);

    expect(await findActiveSchoolNameIssues(SchoolType.Elementary)).toEqual([]);
  });

  test("leaves a name still used by another school of the city", async () => {
    // the school is renamed again, but another school now has its old name
    await getKnexDb()("school").where({ izo: school.izo }).update({ name: "Nový název" });
    await getKnexDb()("school").where({ izo: otherSchool.izo }).update({ name: newName });
    const before = await latestText(1);
    const rename = { izo: school.izo, type: SchoolType.Elementary, oldName: newName, newName: "Nový název" };
    const result = await rewriteRenamedSchools([rename]);
    expect(result.rewritten).toEqual([]);
    expect(result.ambiguous).toEqual([rename]);
    expect(await latestText(1)).toBe(before);
  });
});
