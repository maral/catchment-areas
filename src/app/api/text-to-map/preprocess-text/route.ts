import { api } from "@/app/api/[...remult]/api";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { remult } from "remult";

type SchoolResult = {
  school: string;
  streets: string[];
  municipalityParts: string[];
};

type ChatCompletionRequestMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
type CreateChatCompletionRequest = {
  model: string;
  messages: ChatCompletionRequestMessage[];
  temperature: number;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ordinanceRepo = remult.repo(Ordinance);
const streetMarkdownRepo = remult.repo(StreetMarkdown);

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { ordinanceId, founderId, customText } = await request.json();

  const ordinance = await api.withRemult(async () => {
    return await ordinanceRepo.findId(ordinanceId);
  });

  const processedText = await getProcessedText(
    customText || ordinance.originalText
  );

  const streetMarkdown = await api.withRemult(async () => {
    const user = await remult.repo(User).findId(remult.user!.id);
    const founder = await remult.repo(Founder).findId(founderId);

    // initial version
    await streetMarkdownRepo.insert({
      ordinance,
      createdAt: new Date(),
      sourceText: processedText,
      comment: "Automaticky zpracovaný text z vyhlášky.",
      state: StreetMarkdownState.Initial,
      user,
      founder,
    });

    // insert autosave to write over immediately
    return streetMarkdownRepo.insert({
      ordinance,
      sourceText: processedText,
      comment: "Automatická záloha",
      state: StreetMarkdownState.AutoSave,
      user,
      founder,
    });
  });

  return NextResponse.json({
    processedText,
    autosaveStreetMarkdownId: streetMarkdown.id,
  });
}

async function getProcessedText(originalText: string) {
  if (originalText.length < 50) {
    return originalText;
  }

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: originalText,
    },
  ];

  const answer = await getGptAnswer(messages);

  const result = parseGptAnswer(answer);

  let processedText = "";
  if (result) {
    for (const school of result) {
      processedText += school.school + "\n";
      if (school.streets) {
        for (const street of school.streets) {
          processedText += street + "\n";
        }
      }
      if (school.municipalityParts) {
        for (const municipalityPart of school.municipalityParts) {
          processedText += "část obce " + municipalityPart + "\n";
        }
      }
      processedText += "\n";
    }
    return processedText;
  } else {
    return originalText;
  }
}

function parseGptAnswer(answer: string | undefined): SchoolResult[] | null {
  if (!answer) {
    return null;
  }
  // the model sometimes wraps the JSON in a markdown code block
  const json = answer
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  try {
    const result = JSON.parse(json);
    return Array.isArray(result) ? result : null;
  } catch (error) {
    console.error("Could not parse GPT answer as JSON:", error);
    return null;
  }
}

const getGptAnswer = async (
  messages: CreateChatCompletionRequest["messages"]
): Promise<string | undefined> => {
  try {
    const result = await openai.chat.completions.create({
      // large ordinances produce long answers, the model needs a big output limit
      model: "gpt-4.1-mini",
      messages: messages,
      temperature: 0.1,
    });
    const choice = result.choices.pop();
    if (choice?.finish_reason === "length") {
      console.error("GPT answer was truncated (output token limit reached)");
      return undefined;
    }
    return choice?.message?.content ?? undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

const chunkLength = 4800;
const overlapLength = 1200;

function splitTextToChunks(text: string): string[] {
  let i = 0;
  const chunks: string[] = [];
  while (i < text.length) {
    let end = Math.min(i + chunkLength, text.length);
    // if less than overlapLength characters left, set end to the end of the text
    end = text.length - end < overlapLength ? text.length : end;
    chunks.push(text.substring(i, end));
    if (end >= text.length) {
      break;
    }
    i += chunkLength - overlapLength;
  }
  return chunks;
}

const systemPrompt = `Uživatel ti pošle text z PDF spádové vyhlášky, ve které jsou uvedené definice ulic pro jednotlivé školy. Text z PDF je poměrně rozházený, protože se zbavil formátování. Tvým úkolem je z něj získat vyčištěný seznam škol a ke každé škole všechny ulice (případně celé části obce), ze kterých se její spádový obvod skládá. Výstup se dále strojově zpracovává, proto musí přesně dodržet pravidla níže.

## Formát výstupu

Odpověz pouze validním JSON polem (bez komentářů, bez čárek za posledním prvkem, bez dalšího textu), např.:
[
  {
    "school": "Základní škola Dr. Miroslava Tyrše Děčín, Vrchlického 630/5, příspěvková organizace",
    "streets": [
      "Akátová",
      "náměstí Míru",
      "Šrobárova - č. 1-15",
      "Komenského - lichá č. 1-29, sudá č. 2-40",
      "Palackého - č. 12, 12b, 14a",
      "Nádražní - č. p. 120, 135",
      "Husova - č. 20 a výše",
      "Jiráskova - bez č. 5, 7"
    ],
    "municipalityParts": ["Bynov"]
  }
]

## Název školy

Uveď vždy celý název školy tak, jak je ve vyhlášce, většinou včetně adresy školy.

## Ulice

- Každá položka obsahuje název jedné ulice v plném tvaru, zkratky rozepiš (např. "nám. Míru" → "náměstí Míru", "nábř." → "nábřeží", "tř." → "třída").
- Pokud patří škole celá ulice, uveď jen její název, bez čísel.
- Pokud patří škole jen některá čísla, odděl je od názvu ulice vždy " - " (mezera, pomlčka, mezera). Nikdy nepiš čísla přímo za název ulice.
  - špatně: "Palackého 12, 12b"; "Palackého (č. 12, 12b)"; "Palackého: 12-20"
  - správně: "Palackého - č. 12, 12b"; "Palackého - č. 12-20"
- Za " - " musí každá skupina čísel začínat typem čísel:
  - "č." = všechna (orientační) čísla, "lichá č." = lichá, "sudá č." = sudá, "č. p." = čísla popisná
  - čísla po typu jsou buď jednotlivá ("č. 7", "č. 12b"), rozsah ("č. 2-66"), "č. 20 a výše" nebo "do č. 18"
  - více čísel nebo rozsahů odděluj ", " (např. "lichá č. 1-9, 11, 23 a výše")
  - více skupin různého typu odděluj také ", " a typ uveď znovu (např. "lichá č. 1-29, sudá č. 2-40")
  - výjimky zapiš pomocí "bez" (např. "Jiráskova - bez č. 5, 7")
- Závorky z originálu odstraň.
- Pokud se ulice ve vyhlášce opakuje u jedné školy s různými čísly, můžeš ji uvést vícekrát.

## Části obce

- Do "municipalityParts" patří pouze části obce (např. vesnice, osady), které vyhláška výslovně přiřazuje škole celé, bez výčtu ulic.
- Pokud jsou u části obce uvedeny jen vybrané ulice, část obce neuváděj a uveď jen ty ulice.
- Nikdy sem nedávej název města, obce nebo městské části / městského obvodu, pro který vyhláška platí (např. "Praha 2", "Brno-střed", "Ostrava-Jih"), ani název, který se ve vyhlášce objevuje jen v záhlaví, v názvu školy nebo v adrese.
- Pokud vyhláška u školy žádnou celou část obce nezmiňuje, vrať prázdné pole [].

Než odpovíš, zkontroluj, že ti nechybí žádná škola ani ulice a že každá ulice s čísly odpovídá pravidlům výše.
`;
