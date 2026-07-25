import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import iconv from "iconv-lite";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { loadGradesByIzo } from "../../src/migration/grades";

const HEADER =
  "RedIzo;Nazev;Ico;AdresaRUIAN;TypZrizovatele;ZrizovatelIco;ZrizovatelNazev;" +
  "SkolaIzo;SkolaNazev;DruhSkoly;SkolaAdresa;EditorIco;EditorNazev;" +
  "t1;t2;t3;t4;t5;t6;t7;t8;t9;Stupen";

// SkolaIzo is col 8; t1..t9 are cols 14..22. `t` is a 9-char mask where 'X'
// means the grade is taught and any other char (e.g. '_') means blank.
const cells = (t: string) =>
  t
    .padEnd(9, "_")
    .slice(0, 9)
    .split("")
    .map((c) => (c === "X" ? "X" : ""))
    .join(";");
const row = (izo: string, name: string, t: string) =>
  `600000001;R;1;2;2;3;Z;${izo};${name};B00;A;4;E;${cells(t)};3`;

let dir: string;
let csv: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "grades-"));
  csv = join(dir, "rejstrik.csv");
  const lines = [
    HEADER,
    row("111111111", "Plná škola", "XXXXXXXXX"), // 1-9
    row("222222222", "První stupeň", "XXXXX____"), // 1-5 only
    row("333333333", "Mateřská škola", "_________"), // none
    // duplicate IZO with complementary grades -> union: 1-5 ∪ 5-8 = 1-8
    row("444444444", "Škola A", "XXXXX____"),
    row("444444444", "Škola A (2)", "____XXXX_"),
  ].join("\n");
  // written in Windows-1250 to exercise the decode path (Czech chars above)
  writeFileSync(csv, iconv.encode(lines + "\n", "win1250"));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("loadGradesByIzo", () => {
  test("maps X -> true, blank -> false, keyed on SkolaIzo", () => {
    const grades = loadGradesByIzo(csv);
    expect(grades("111111111")).toEqual({
      t1: true, t2: true, t3: true, t4: true, t5: true,
      t6: true, t7: true, t8: true, t9: true,
    });
    expect(grades("222222222")).toMatchObject({
      t1: true, t5: true, t6: false, t9: false,
    });
    expect(grades("333333333")).toMatchObject({ t1: false, t9: false });
  });

  test("unknown IZO -> undefined; whitespace tolerated", () => {
    const grades = loadGradesByIzo(csv);
    expect(grades("999999999")).toBeUndefined();
    expect(grades("  111111111 ")).toBeDefined();
  });

  test("duplicate IZO rows union their grades (never lose an X)", () => {
    const grades = loadGradesByIzo(csv);
    // "XXXXX" (1-5) ∪ "____XXXX" (5-8) -> 1..8 true, 9 false
    expect(grades("444444444")).toEqual({
      t1: true, t2: true, t3: true, t4: true, t5: true,
      t6: true, t7: true, t8: true, t9: false,
    });
  });
});
