import { downloadAndExtractText } from "@/utils/server/textExtraction";

const main = async () => {
  const url =
    process.argv.length >= 3
      ? process.argv[2]
      : "https://sbirkapp.gov.cz/detail/SPPYUSDZAY2O2UNS/text";

  const result = await downloadAndExtractText(url);
  console.log(result.text);
};

main();
