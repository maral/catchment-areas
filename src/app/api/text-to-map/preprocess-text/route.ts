import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { remult } from "remult";
import { api } from "@/app/api/[...remult]/api";
import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";

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
  // if (!await isLoggedIn()) {
  //   return getNotLoggedInResponse();
  // }
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { ordinanceId } = await request.json();

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

const budejovice = `STATUTÁRNÍ MĚSTO ČESKÉ BUDĚJOVICE
ZASTUPITELSTVO MĚSTA ČESKÉ BUDĚJOVICE














OBECNĚ ZÁVAZNÁ
VYHLÁŠKA


č.  1/2021

kterou se stanoví školské obvody a části společných školských obvodů
základních škol
ze dne 22. 3. 2021
účinnost ode dne 7. 4. 2021


 2
STATUTÁRNÍ MĚSTO ČESKÉ BUDĚJOVICE
ZASTUPITELSTVO MĚSTA ČESKÉ BUDĚJOVICE

OBECNĚ ZÁVAZNÁ VYHLÁŠKA
č. 1/2021
kterou se stanoví školské obvody a části společných školských obvodů základních škol
Zastupitelstvo statutárního města České Budějovice se na svém zasedání konaném dne
22. 3. 2021 usneslo (usnesení č. 26/2021) vydat na základě § 178 odst. 2 písm. b) a c) zákona
č. 561/2004 Sb., o předškolním, základním, středním, vyšším odborném a jiném vzdělávání
(školský zákon), ve znění pozdějších předpisů, a v souladu s § 35 a § 84 odst. 2 písm. h) zákona
č. 128/2000 Sb., o obcích (obecní zřízení), ve znění pozdějších předpisů, tuto obecně závaznou
vyhlášku:
ŠKOLSKÉ OBVODY ZÁKLADNÍCH ŠKOL

Čl. 1
Školské obvody základních škol
Na území statutárního města se stanovují následující školské obvody základních škol:


(1) Základní škola a Mateřská škola J. Š. Baara, Jírovcova 9/a, České Budějovice
celé ulice:
A. Trägera, Česká, Dolní, Dr. Tůmy,  Generála  Píky, H. Kvapilové, Heritesova,  Horní,
Hradební, Hroznová, Hůrská, J. Hloucha, Jírovcova,  K. Světlé,  K. Weise,  Kamenická,
Kostelní,  Krajinská,  Květná,  M. Millauera, Mlýnská,  Nemanická,  Panská,  Piaristická,
Piaristické nám.,  Prostřední, Radniční,  Roberta Bosche,  Severní, Sokolský ostrov,
Suchomelská, Školní, tř. 28. října, Tyršův sad, U Hřbitova, V. Rabase, Vltavská, Za Otýlií
části ulic:
B. Smetany sudá čísla do č. 36, lichá čísla do 61,
Fráni Šrámka sudá čísla do č. 40a, lichá čísla do č. 43,
J. Š. Baara sudá čísla do č. 40, lichá čísla do č. 37,
Kněžskodvorská sudá čísla od č. 12, lichá čísla od č. 21,
Nerudova sudá čísla od č. 24, lichá čísla od č. 33,
Pekárenská sudá čísla do č. 32a, lichá čísla do č. 37,
Pražská tř. sudá čísla do č. 108, lichá čísla od č. 117 do č. 145,
Puklicova sudá čísla od č. 30, lichá čísla od č. 21,
Riegrova sudá čísla do č. 6c, lichá čísla do č. 25,
Skuherského sudá čísla do č. 54, lichá čísla do 47.


 3
Na základě uzavřené dohody statutárního města České Budějovice s obcí Doudleby, Nedabyle
a Vrábče o vytvoření společného školského obvodu se stanoví část společného školského
obvodu Základní školy a Mateřské školy, J. Š. Baara, Jírovcova 9/a, České Budějovice.


 (2) Základní škola a Mateřská škola Nová 5, České Budějovice
celé ulice:
Blahoslavova, Chelčického,  J. Plachty,   Jeremiášova,  Kanovnická,  Klaricova,  Kněžská,
Korandova,  Krátká,  Libničská, Lipenská, Lomená, Mikuláše Faulfiše, Mikuláše z Husi,
Na Mlýnské stoce,   Na Sadech, Nádražní, Nová,  Otakarova, Palackého nám., Plachého,
Rokycanova, Štítného, Trocnovská, U Černé věže, U Křížku, Žerotínova
části ulic:
B. Smetany sudá čísla od č. 38, lichá čísla od č. 63,
Fráni Šrámka sudá čísla od č. 42, lichá čísla od č. 45,
J. Š. Baara sudá čísla od č. 42, lichá čísla od č. 39,
Jeronýmova sudá čísla od č. 12, lichá čísla od č. 25,
Lannova tř. lichá čísla,
Pekárenská sudá čísla od č. 34, lichá čísla od č. 39,
Riegrova sudá čísla od č. 8, lichá čísla od č. 27,
Rudolfovská tř. sudá čísla do č. 54, lichá čísla do č. 47,
Skuherského sudá čísla od č. 56, lichá čísla od č. 49.

Na  základě  uzavřené  dohody  statutárního  města  České  Budějovice  s obcí  Vidov,  Plav  o
vytvoření společného školského obvodu se stanoví část společného školského obvodu Základní
školy a Mateřské školy, Nová 5, České Budějovice.


(3) Základní škola, Dukelská 11, České Budějovice
celé ulice:
Alešova,  Biskupská, Borovanská, Buková, Doubravická,  Doudlebská Dr. Stejskala,
Dvořákova, Jana Hurta, Jirsíkova,  Karla IV.,  Kasárenská, K Tůním,  K Jezu,  Platanová,
K Jezírkům, Kaštanová,  Ke Studánce, Pod    Drahou, Prokišova,  Průmyslová, Říční,
Senovážné nám., Široká, Střížovská, Šeříková, Šroubárenská, Topolová, Velenická, Vidovská,
Za Tratí, U Elektrárny, U Tří lvů, Zátkovo nábř., Žižkova tř.,
části ulic:
Čechova sudá čísla do č. 20, lichá čísla do 19,
Dukelská sudá čísla do č. 10, lichá čísla do č. 19,
Jeronýmova sudá čísla do č. 10, lichá čísla do č. 23,
Lannova tř. sudá čísla,
Mánesova sudá čísla od č. 46, lichá čísla od č. 5,
nám. Přemysla Otakara II. od č. 3,
Novohradská sudá čísla do č. 42, lichá čísla do č. 31,
Vrchlického nábř. sudá čísla do č. 8, lichá čísla,
Novohradská sudá čísla od č. 82, lichá čísla od č. 71


 4

(4) Základní škola, Grünwaldova 13, České Budějovice
celé ulice:
Bachmačská,  B. Němcové,  Boletická, Čelakovského,  E. Pittera,  Erbenova,  Grünwaldova,
Heydukova, Jánošíkova, Jánská, Jungmannova, L. B. Schneidera, L. M. Pařízka, Litvínovická,
Máchova,  nám. Jiřího z Poděbrad,  Pabláskova,  Preslova,  Purkyňova,  Roudenská,
S. K. Neumanna,  Stromovka,  Šumavská,  Thomayerova,  Tichá,  U Lučního jezu,  U Vltavy,
U Zastávky
části ulic:
Lidická tř. sudá čísla od č. 60 do 142, lichá čísla od č. 53 do č. 123.


(5) Základní škola a Mateřská škola, Kubatova 1, České Budějovice
celé ulice:
Budivojova,   Fr. Hrubína,  Holečkova, Jar. Haška,  Jiráskovo nábř.,  Klavíkova,  Kubatova,
Mariánské nám., Resslova, Staroměstská, Vltavské nábř.,
části ulic:
Husova tř. sudá čísla do č. 28, lichá čísla do č. 11,
Pražská tř. lichá čísla do č. 75,
Puklicova sudá čísla do č. 28, lichá čísla do č. 19.


(6) Základní škola, Matice školské 3, České Budějovice
celé ulice:
Brožíkova, Budovcova, F. A. Gerstnera, Generála Svobody, Goethova, Havlíčkova Kaplířova,
Karla Buriana,  Komenského,  Křižíkova,  Luční,  M. Vydrové,  Matice školské,  Mayerova,
Na Dlouhé louce, Na Nábřeží, Pivovarská, Polní, Roháče z Dubé, Střelecký ostrov,  Tylova,
U Koněspřežky, U Malše, U Vodárny, U Zimního stadionu, V Zátiší, Volejbalistů, Zeyerova
části ulic:
Čechova sudá čísla od č. 22, lichá čísla od č. 21,
Dukelská sudá čísla od č. 12, lichá čísla od č. 21,
Lidická sudá čísla do č. 58, lichá čísla do č. 51,
Mánesova sudá čísla do č. 44, lichá čísla do č. 3b,
Vrchlického nábř. sudá čísla od č. 10.




 5
(7) Základní škola a Mateřská škola, Vl. Rady 1, České Budějovice
celé ulice:
Ant. Janouška, Březová, Fr. Halase, J. Dietricha, J. Masaryka, Jalovcová, Jasanová, Jasmínová,
Javorová, Jedlová, K. V. Raise, Kališnická, Ke Špačkům, Kpt. Jaroše, Kpt. Nálepky, Mechová,
Na Bělidle,  nám. Švabinského,  Olivová,  Osiková,  Palmová,  Potoční,  U Červeného dvora,
U Dráhy, V. Vydry, Vl. Rady, Vrbová, Zd. Fibicha
části ulic:
Novohradská sudá čísla od č. 44 do č. 80, lichá čísla od č. 33 do č. 69.


(8) Základní škola a Mateřská škola, Nerudova 9, České Budějovice
celé ulice: Čéčova, Hálkova, Hlubocká, Hosínská, Jana Štursy, Jižní, Jubilejní, K Rybníku,
K Úsilnému,  K. Šatala, Klostermannova,  Neklanova,  Neplachova, Opatovická,  Plzeňská,
Průběžná, Rybářská, Strakonická, Světlíky, U Čertíka, U Trojice, U Tří dubů, U Voříškova
dvora, V Oblouku, Za Hřištěm, Zachariášova
části ulic:
Kněžskodvorská sudá čísla do č. 10, lichá čísla do č. 19,
Nerudova sudá čísla do č. 22, lichá čísla do č. 31,
Pražská tř. sudá čísla od č. 110, lichá čísla od č. 77 do č. 115 a od č. 147.

Na  základě  uzavřené  dohody  statutárního  města  České  Budějovice  s obcí  Borek,  Hosín,
Homole,  Hrdějovice,  Hůry, Nová  Ves  u  Českých  Budějovic,  Planá  a  Úsilné  o  vytvoření
společného školského obvodu se stanoví část společného školského obvodu Základní školy
Nerudova 9, České Budějovice.


(9) Základní škola a Mateřská škola, T. G. Masaryka, Rudolfovská 143, České
Budějovice
celé ulice:
B. Martinů,  Hlinská,  Jana Milíče,  K Lučinám,  M. Svobodové,  Okružní,  Prokopa Holého,
Slévárenská,  Tovární,  U Jeslí,  U Pily,   U Sirkárny,  U Smaltovny,   U Skladu,  Vřesová,
Za Rybníkem, Žitná
části ulic:
Dobrovodská sudá čísla do č. 14, lichá čísla do č. 11a,  
Příčná sudá čísla do č. 4, lichá čísla do č. 11,
Rudolfovská tř. sudá čísla od č. 55, lichá čísla od č. 49,
Vodní sudá čísla do č. 8, lichá čísla.


 6
(10) Základní škola a Mateřská škola, L. Kuby 48, České Budějovice
celé ulice:
A. Krejčího, Antala Staška, Beránkovo nábř., Boh. Kafky, Boršovská, B. Böhma, Bujanovská,
Drátenická,  E. E. Kische,   Fr. Bílka,  Fügnerova,  Holkovská,  Chlumecká,  J. B. Foerstera,
J. Buděšínského,  J. K. Chmelenského,  Jana Kollára,  Janáčkova,  Jar. Hůlky,  Jaselská,
Josefa Lady, J. Němce, J.R.  Schustera, K. Kovařovice, K. Lávičky, Kamnářská, Ke Včelné,
Kolářská,  Kozinova,  Krumlovská,  L. Kuby,  Malebná,  Mezi Tratěmi,  Na Blatech,
Na Děkanských polích,  Na Hraničkách,  Na Výsluní,  nám. Bratří  Čapků,  Omlenická,
Ot. Březiny,  Ovocná,  P. J. Šafaříka,  Papírenská,  Parková,  Pastevní,  Plánská,  Plavská,
Revoluční,  Rožnovská,  Růžová,  Římovská,  Sadová,  Sedlářská,  Slunečná,  Sokolovská,
St. Čečka,  Stradonická,  Strádova,  Stropnická,  V Zahrádkách,  V. Nováka,  Velešínská,
Zlatnická, Zvonková,
části ulic:
Lidická sudá čísla od č. 144, lichá čísla od č. 125.


(11) Základní škola, Pohůrecká 16, České Budějovice
celé ulice:
A. Kříže,  Boleslavova,  Bořivojova,  Brandlova,  Brigádnická,  Dalimilova,  Dělnická,
Dienzenhoferova,  Družstevní,  E. Beneše,  El. Krásnohorské,  Fr. Škroupa,  H. Malířové,
Heřmánková,  Hlinecká,  Horymírova,  Hraniční,  I. Olbrachta,  J. Dobrovského,  J. Jindřicha,
J. Lomského, Jabloňová, Jana Čapka, Jana Čarka, Jar. Ježka, Jiřího z Poděbrad, Josefa Hory,
K Dolíčku, K. Vinařického, Kaliště, Kamarytova, Karla Tomana,  Karla Uhlíře, Kopretinová,
Kosmova,  Krokova,  Ledenická,  Lesní,  Libušina,  Macharova,  Ot. Ševčíka,  Plynárenská,
Pod Lékárnou,  Pohůrecká,  Prašná,  Přemyslova,  Puchmajerova,  Reinerova,  Sámova,
Stará cesta,  Suchovrbenská,  Suchovrbenské nám.,  tř. Čsl. legií,  Třebízského,  Třebotovice,
Třešňová, Tyršova, U Cihelny,  U Lávky, U Pramene,  U Rybníka, U Školy, V Hluboké cestě,
V. Nezvala, V. Špály, Vl. Vančury, Vrbenská, Železničářská, Želivského
části ulic:
Dobrovodská sudá čísla od č. 14a, lichá čísla od č. 13,
Příčná sudá čísla od č. 6, lichá čísla od č. 13,
Vodní sudá čísla od č. 10.


 (12) Základní škola a základní umělecká škola, Bezdrevská 3, České Budějovice
celé ulice:
Bezdrevská,  České Vrbné,  Dlouhá,  Fr. Ondříčka, Hirzova,    J. Boreckého,  Jizerská,
Josefy Kolářové,  Krčínova,  Labská,  Na Jízdárně,  Otavská,  Písecká,  Rybniční,  U Bašty,
U Hvízdala, U Staré trati, Vodňanská
části ulic:
Husova sudá čísla od č. 106.





 7
(13) Základní škola Máj I, M. Chlajna 21, České Budějovice
celé ulice, lichá čísla:
Ant. Barcala,   Dr. Bureše,  Dubenská,  Haklovy Dvory,   J. Bendy,   K. Chocholy,   K. Štěcha,
Loucká,  M. Horákové,  M. Chlajna, N. Frýda,  Nové  Dvory,  Spojovací,  U Boru,  U Hada,
U Lesa, U Rozvodny, V. Volfa, Zavadilka,
Části ulic:
náměstí Přemysla Otakara II. číslo 1 a 2.


(14) Základní škola Máj II, M. Chlajna 23, České Budějovice
celé ulice, sudá čísla:
Ant. Barcala,   Dr. Bureše,  Dubenská,  Haklovy Dvory,   J. Bendy,   K. Chocholy,   K. Štěcha,
Loucká, M. Chlajna, N. Frýda, Nové Dvory, Spojovací, U Boru, U Hada, U Lesa, U Rozvodny,
V. Volfa, Zavadilka.
části ulic:
M. Horákové sudá čísla do č. 70.

Na základě uzavřené dohody statutárního města České Budějovice s obcí Boršov nad Vltavou
o  vytvoření  společného  školského  obvodu  se  stanoví  část  společného  školského  obvodu
Základní školy Máj II. M. Chlajna 23, České Budějovice.


(15) Základní škola, O. Nedbala 30, České Budějovice
celé ulice:
E. Rošického,  Generála  Klapálka,  K Parku,   K. Šafáře,  Lhenická,  Nadporučíka  Křečana,
Netolická, O. Nedbala, Plukovníka Malého, Poručíka Vondráška, Prachatická, T. G. Masaryka,
Zahradní
části ulic:
Ant. Slavíčka sudá čísla od č. 16, lichá čísla od č. 15,
Husova tř. sudá čísla od č. 84 do č. 104, lichá čísla od č. 107,
J. Opletala sudá čísla od č. 4, lichá čísla od č. 35,
Na Zlaté stoce sudá čísla od č. 42, lichá čísla od č. 53,
Ot. Ostrčila sudá čísla od č. 10, lichá čísla od č. 9,
U Výstaviště sudá čísla od č. 28, lichá čísla od č. 17,
V. Talicha mimo č. 2,
Větrná sudá čísla od č. 34 do č. 66, lichá čísla od č. 3.

Na základě uzavřené dohody statutárního města České Budějovice s obcí Čejkovice, Dasný o
vytvoření společného školského obvodu se stanoví část společného školského obvodu Základní
školy Oskara Nedbala 30, České Budějovice.






 8
(16) Základní škola, Emy Destinové 46, České Budějovice
a) celé ulice:
Ant. Sovy,  Branišovská,  Buzulucká,  Čajkovského,  E. Destinové,  K. Fleischmanna,
Ke Střelnici,  Kijevská,  Lipová,  Na Sádkách,  Na Samotách,  Na Stráňce,  Pasovská,
Pod Vodojemem,   Pod Železným vrškem,  Sokolská,  Studentská,  Sukova,  Šindlodvorská,
Šípková, Švábův Hrádek, Trnková, Třebínská, U Bagru, U Stromovky, Úzká, V Březinách
části ulic:
Ant. Slavíčka sudá čísla do č. 14, lichá čísla do č. 13,
Husova tř. sudá čísla od č. 30 do č. 82, lichá čísla od č. 13 do č. 105,
J. Opletala sudá čísla do č. 2, lichá čísla do č. 33,
M. Horákové sudá čísla od č. 72,
Na Zlaté stoce sudá čísla do č. 40, lichá čísla do č. 51,
Ot. Ostrčila sudá čísla do č. 8, lichá čísla do č. 7,
U Výstaviště sudá čísla do č. 26, lichá čísla do č. 15,
Větrná sudá čísla do č. 32 a od č. 68 od č. 76, liché č. 1,
V. Talicha sudé číslo č. 2.


(17) Základní škola a Mateřská škola Dobrá Voda u Českých Budějovic
Na  základě  uzavřené  dohody  statutárního  města  České  Budějovice  s obcí Dobrá  Voda
u Českých Budějovic o vytvoření společného školského obvodu se stanoví část společného
školského obvodu Základní školy a Mateřské školy Dobrá Voda u Českých Budějovic, kterou
tvoří část městské části Třebotovice vymezená v mapovém vyobrazení uvedeném v příloze č.1
této vyhlášky.



Čl. 2
Přiřazení škol jen s I. stupněm ZŠ


(1) Školský obvod

a) Základní školy a Mateřské školy, Vl. Rady 1, České Budějovice se pro žáky druhého stupně
přiřazuje ke školskému obvodu Základní školy, Emy Destinové 46, České Budějovice,

b) Základní školy a Mateřské školy T. G. Masaryka, Rudolfovská 143, České Budějovice se
pro žáky  druhého  stupně  přiřazuje ke  školskému  obvodu  Základní  školy, Nová  5,  České
Budějovice.









 9
Čl. 3
Zrušovací ustanovení
Zrušuje se:
(1) Obecně závazná vyhláška č. 3/2015 ze dne 12. 10. 2015, kterou se stanoví školské
obvody základních škol zřizovaných statutárním městem České Budějovice.
(2) Obecně závazná vyhláška č. 1/2017 ze dne 13. 2. 2017, kterou se mění obecně závazná
vyhláška č. 3/2015, kterou se stanoví školské obvody základních škol zřizovaných
statutárním městem České Budějovice
(3) Obecně závazná vyhláška č. 3/2017 ze dne 19. 6. 2017, kterou se mění obecně závazná
vyhláška č. 3/2015, kterou se stanoví školské obvody základních škol zřizovaných
statutárním městem České Budějovice, ve znění obecně závazné vyhlášky č. 1/2017


Čl. 4
Závěrečná ustanovení


(1) Tato obecně závazná vyhláška nabývá účinnosti patnáctým dnem po dni jejího vyhlášení.



 Ing. Jiří Svoboda v. r.  Ing. Viktor Vojtko, Ph.D. v. r.
 primátor města náměstek primátora`;
