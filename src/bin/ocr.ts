import { extractText } from "@/utils/server/textExtraction";

const main = async () => {
  console.log("Extracting text...");
  await extractText("https://sbirkapp.gov.cz/detail/SPPT6LCKVIR4SLTC/text");
  console.log("Done!");
};

main();
