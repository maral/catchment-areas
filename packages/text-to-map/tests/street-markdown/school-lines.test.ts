import { describe, expect, test } from "@jest/globals";
import {
  findSchoolLines,
  findSchoolNameIssues,
} from "../../src/street-markdown/school-lines";

const schools = [
  { izo: "1", name: "Základní škola Svitavy, Felberova 2" },
  { izo: "2", name: "Základní škola a mateřská škola Svitavy, Riegrova 4, příspěvková organizace" },
  { izo: "3", name: "Mateřská škola Svitavy" },
];

describe("findSchoolLines", () => {
  test("an area's first line is a school; further lines only when close to a name", () => {
    const lines = [
      "Základní škola Svitavy, Felberova 2",
      "Mateřská škola Svitavy",
      "Felberova",
      "Mateřská škola Svitavy",
      "",
      "Základní škola Svitavy, Riegrova 4",
      "Riegrova",
    ];
    expect(findSchoolLines(lines, schools)).toEqual([
      { lineNumber: 1, line: lines[0], first: true, school: schools[0], exact: true },
      { lineNumber: 2, line: lines[1], first: false, school: schools[2], exact: true },
      // a renamed school's old name still resolves — to the closest name
      { lineNumber: 6, line: lines[5], first: true, school: schools[0], exact: false },
    ]);
  });

  test("a further line within edit distance 4 is a school, though not exact", () => {
    const lines = ["Základní škola Svitavy, Felberova 2", "Materska skola Svitavy"];
    expect(findSchoolNameIssues(lines, schools)).toEqual([
      { lineNumber: 2, line: lines[1], first: false, school: schools[2], exact: false },
    ]);
  });

  test("skips ! comments, trims, and stops at a founder switch (#)", () => {
    const lines = ["! poznámka", "  Mateřská škola Svitavy  ", "", "# Litomyšl", "Něco jiného"];
    expect(findSchoolLines(lines, schools)).toEqual([
      { lineNumber: 2, line: "Mateřská škola Svitavy", first: true, school: schools[2], exact: true },
    ]);
  });

  test("a founder with no schools resolves nothing", () => {
    expect(findSchoolLines(["Mateřská škola"], [])).toEqual([
      { lineNumber: 1, line: "Mateřská škola", first: true, school: null, exact: false },
    ]);
  });
});
