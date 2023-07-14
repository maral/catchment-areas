import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { remult } from "remult";
import { api } from "../../[...remult]/route";
import { getServerSessionWithOptions } from "../../auth/[...nextauth]/config";

interface SchoolResult {
  school: string;
  streets: string[];
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
      for (const street of school.streets) {
        processedText += street + "\n";
      }
      processedText += "\n";
    }
  } else {
    processedText = ordinance.originalText;
  }

  const streetMarkdownRepo = remult.repo(StreetMarkdown);
  const streetMarkdown = await api.withRemult(async () => {
    const user = await remult.repo(User).findId(remult.user!.id);
    console.log("user");

    // initial version
    await streetMarkdownRepo.insert({
      ordinance,
      createdAt: new Date(),
      sourceText: processedText,
      comment: "Automaticky zpracovaný text z vyhlášky.",
      state: StreetMarkdownState.Initial,
      user,
    });

    console.log("first streetMarkdown");

    // insert autosave to write over immediately
    return streetMarkdownRepo.insert({
      ordinance,
      sourceText: processedText,
      comment: "Automatická záloha",
      state: StreetMarkdownState.AutoSave,
      user,
    });
  });

  console.log("second streetMarkdown");

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

const ordinanceText = `Město Rychnov nad Kněžnou
Zastupitelstvo města

Obecně závazná vyhláška města Rychnov nad Kněžnou,
kterou se stanoví školské obvody základních škol
a části společných školských obvodů základních škol

Zastupitelstvo města Rychnov nad Kněžnou se na svém zasedání dne 24.4.2023 usnesením č. 30/2023
usneslo vydat na základě ust. § 178 odst. 2 písm. b) a c) zákona č. 561/2004  Sb.,  o předškolním,        
základním,  středním,  vyšším  odborném  a  jiném  vzdělávání  (školský  zákon),  ve  znění  pozdějších   
předpisů, a v souladu s ust. § 10 písm. d) a § 84 odst. 2 písm. h) zákona č. 128/2000 Sb., o obcích (obecní
zřízení), ve znění pozdějších přepisů, tuto obecně závaznou vyhlášku:

Čl. 1
Stanovení školských obvodů a částí společných školských obvodů

(1) Na základě dohody uzavřené mezi městem Rychnov nad Kněžnou a obcí Lupenice o vytvoření
společného školského obvodu základní školy, jejímž zřizovatelem je město Rychnov nad Kněžnou,
a obcí Synkov-Slemeno o vytvoření společného školského obvodu základní školy pro  druhý
stupeň ZŠ, jejímž zřizovatelem je město Rychnov nad Kněžnou, se stanovuje část společného
školského  obvodu Základní  školy  Rychnov  nad  Kněžnou,  Javornická  1596, kterou  tvoří
následující území města:
a) ulice: Bajzova, Bejvalova, Ekologická, Fáborského, Fajstova, Javornická, Jirsákova, Kalisova,
Ke  Včelnému,  Kemlinkova,  Mírová,  Na  Jamách,  Na  Spravedlnosti,  Obránců  míru,
Pod Budínem, Sokolovská (pravá strana ve směru od vlakového nádraží), Strojnická, Svobody,
Školní náměstí, Štemberkova, Wolkerova, Zilvarova a
b) část města: Jámy.

(2) Školský obvod Základní školy Rychnov nad Kněžnou, Masarykova 563, pro první stupeň ZŠ
tvoří následující území města:
a) ulice:  5.  května,  A.  Sedláčka,  Anatola  Provazníka,  Balbínova,  Betenglova,  Bezručova,
Bohumila Hrabala, Boženy Němcové, Chaloupky, Českých bratří, Dobrovského, Dr. Otmara
Vaňorného,  Dvořákova,  Fibichova,  Fischerova,  Havlíčkova,  Hradební,  Hrdinů  odboje,
Jabloňová alej, Janáčkova, Jiráskova, Jiřího Šlitra, Jungovo nábřeží, Kaštany, Kolowratská,
Komenského, Koupaliště, Krocínova, Letovisko – Studánka, Malá Láň, Masarykova, Městská
Habrová,  Na  Drahách,  Na  Dubince,  Na  Láni,  Na  Sádkách,  Na  Sboře,  Na  Trávníku,
Na Vyhlídce, Nad Altánem, Nad Dubinkou, Nad Zvonicí, Nádražní, Nové domy, Orlická,
Palackého, Panská, Pelclovo nábřeží, Pod Strání, Poláčkovo náměstí, Průhon, Rudolfa Rokla,
Sady  legií, Smetanova,  SNP,  Sokolovská  (levá  strana  ve  směru  od vlakového  nádraží),
Soukenická,  Staré  náměstí,  Svatohavelská,  Trčkova,  Tylova,  U  Modřinek,  U  Obůrky,
U Stadionu, U Židovského hřbitova, Úzká, Velká Láň, Vycpálkova, Zborovská, Zbuzany a
b) části města: Lipovka, Litohrady, Lokot, Panská Habrová.

(3) Na základě dohody uzavřené mezi městem Rychnov nad Kněžnou a obcemi Jahodov a Lukavice
o  vytvoření společného  školského  obvodu  základní  školy pro  druhý  stupeň  ZŠ,  jejímž
zřizovatelem je město Rychnov nad Kněžnou, se stanovuje část společného školského obvodu
Základní školy Rychnov nad Kněžnou, Masarykova 563, kterou tvoří následující území města:

a) ulice:  5.  května,  A.  Sedláčka,  Anatola  Provazníka,  Balbínova,  Betenglova,  Bezručova,
Bohumila Hrabala, Boženy Němcové, Chaloupky, Českých bratří, Dobrovského, Dr. Otmara
Vaňorného,  Dvořákova,  Fibichova,  Fischerova,  Havlíčkova,  Hradební,  Hrdinů  odboje,
Jabloňová alej, Janáčkova, Jiráskova, Jiřího Šlitra, Jungovo nábřeží, Kaštany, Kolowratská,
Komenského, Koupaliště, Krocínova, Letovisko – Studánka, Malá Láň, Masarykova, Městská
Habrová, Na Drahách, Na Dubince, Na Láni, Na Sádkách, Na Sboře, Na Trávníku, Na Vyhlídce,
Nad Altánem, Nad Dubinkou, Nad Zvonicí, Nádražní, Nové domy, Orlická, Palackého, Panská,
Pelclovo  nábřeží,  Pod  Strání,  Poláčkovo  náměstí,  Průhon,  Rudolfa  Rokla, Sady  legií,
Smetanova,  SNP,  Sokolovská  (levá  strana  ve  směru  od vlakového  nádraží),  Soukenická,
Staré  náměstí, Svatohavelská,  Trčkova,  Tylova,  U  Modřinek,  U  Obůrky,  U  Stadionu,
U Židovského hřbitova, Úzká, Velká Láň, Vycpálkova, Zborovská, Zbuzany a
b) části města: Dlouhá Ves, Lipovka, Litohrady, Lokot, Panská Habrová, Roveň.

(4) Na  základě  dohody  uzavřené  mezi  městem  Rychnov  nad  Kněžnou  a  obcí Jahodov
o  vytvoření společného  školského  obvodu  základní  školy pro  první  stupeň  ZŠ,  jejímž
zřizovatelem je město Rychnov nad Kněžnou, se stanovuje část společného školského obvodu
Základní školy  a mateřské  školy  Rychnov  nad  Kněžnou,  Roveň  60,   kterou tvoří
části města: Dlouhá Ves a Roveň.
Čl. 2
Zrušovací ustanovení

Ruší se obecně závazná vyhláška č.  5/2021, kterou  se stanoví školské obvody základních škol
zřízených městem Rychnov nad Kněžnou, ze dne 22. 9.2021.
Čl. 3
Účinnost

Tato obecně závazná vyhláška nabývá účinnosti dnem 1. 9. 2023.




 ______________________  _____________________
 Ing. Jan Skořepa    Mgr. Jana Drejslová
 starosta          místostarostka
`;
