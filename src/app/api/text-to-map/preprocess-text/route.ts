import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { remult } from "remult";
import { api } from "@/app/api/[...remult]/api";
import { getServerSessionWithOptions } from "../../auth/[...nextauth]/config";

interface SchoolResult {
  school: string;
  streets: string[];
  municipalityParts: string[];
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getGptAnswer = async (
  messages: ChatCompletionRequestMessage[]
): Promise<string | undefined> => {
  try {
    const result = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
      temperature: 0.1,
    });
    return result.data.choices.pop()?.message?.content;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export async function POST(request: NextRequest) {
  const { ordinanceId } = await request.json();

  const session = await getServerSessionWithOptions();
  if (!session) {
    return NextResponse.json(
      {
        error: "You must be signed in.",
      },
      { status: 401 }
    );
  }

  const ordinanceRepo = remult.repo(Ordinance);
  const ordinance = await api.withRemult(async () => {
    return await ordinanceRepo.findId(ordinanceId);
  });

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: ordinance.originalText,
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
  } else {
    processedText = ordinance.originalText;
  }

  const streetMarkdownRepo = remult.repo(StreetMarkdown);
  const streetMarkdown = await api.withRemult(async () => {
    const user = await remult.repo(User).findId(remult.user!.id);

    // initial version
    await streetMarkdownRepo.insert({
      ordinance,
      createdAt: new Date(),
      sourceText: processedText,
      comment: "Automaticky zpracovaný text z vyhlášky.",
      state: StreetMarkdownState.Initial,
      user,
    });

    // insert autosave to write over immediately
    return streetMarkdownRepo.insert({
      ordinance,
      sourceText: processedText,
      comment: "Automatická záloha",
      state: StreetMarkdownState.AutoSave,
      user,
    });
  });

  return NextResponse.json({
    processedText,
    autosaveStreetMarkdownId: streetMarkdown.id,
  });
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
