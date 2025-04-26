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

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { ordinanceId, founderId } = await request.json();

  const ordinanceRepo = remult.repo(Ordinance);
  const ordinance = await api.withRemult(async () => {
    return await ordinanceRepo.findId(ordinanceId);
  });

  const processedText = await getProcessedText(ordinance.originalText);

  const streetMarkdownRepo = remult.repo(StreetMarkdown);
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

  let processedText = "";
  if (answer) {
    const result: SchoolResult[] = JSON.parse(answer);
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

const getGptAnswer = async (
  messages: CreateChatCompletionRequest["messages"]
): Promise<string | undefined> => {
  try {
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
      temperature: 0.1,
    });
    return result.choices.pop()?.message?.content ?? undefined;
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

const systemPrompt = `Uživatel ti pošle text z PDF spádové vyhlášky, ve které jsou uvedené definice ulic pro jednotlivé školy. Každá škola má určitý počet ulic (nebo je definovaná jiným popisem). Text z PDF je poměrně rozházený, protože se zbavil formátování. Uživatel z něj potřebuje získat vyčištěný seznam škol a všechny definice jejich ulic a částí obce, ze kterých se spádový obvod skládá. Definice ulice vždy obsahuje název ulice a navíc může obsahovat popis čísel popisných / orientačních, rozsah od-do atp. Části obcí obsahují pouze název části obce.

Prosím výstup ve formátu JSON, podobně jako tady:
[
{
  "school": "Základní škola Dr. Miroslava Tyrše Děčín II, Vrchlického 630/5, příspěvková organizace",
  "streets": [
     "Akátová",
     "Příčná",
     "Šrobárova - od č. 1 do č. 15",
  ],
  "municipalityParts": [
    "Děčín II"
  ],
},
{ // další škola },
{ // další škola }
]

U názvu školy prosím vždy uveď celý název školy, většinou bývá v názvu i adresa školy.

U názvů ulic vždy odděluj upřesnění ulice (jako např. "od č. 1 do č. 15") od názvu ulice pomlčkou, např: Šrobárova - od č. 1 do č. 15. Odstraň závorky, pokud jsou v originále.

U názvů částí obcí uveď pouze ty, které jsou celé pod danou školou. Pokud jsou pod částí obce uvedeny pouze vybrané ulice a není použita celá část, do výstupu tuto část obce neuváděj.

Zkontroluj si, že jsi udělal všechny tyto kroky a že ti nechybí žádná škola, ulice ani část obce.
`;
