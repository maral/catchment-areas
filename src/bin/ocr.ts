import { fileTypeFromFile } from "file-type";
import { createWriteStream, readFileSync, renameSync, unlinkSync } from "fs";
import { get } from "https";
import { uniqueId } from "lodash";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import WordExtractor from "word-extractor";

// 'https://sbirkapp.gov.cz/detail/SPPAVDN56WKCIHO6/text',

// todo:
// - [X] download the document
// - [X] identify type of document (docx/pdf)
// - [X] text PDF to text
// - [ ] image PDF - extract images
// - [X] OCR extracted images
// - [X] DOCX to text

function parseContentDisposition(contentDisposition?: string) {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}

function download(url: string, path: string): Promise<string> {
  let fileName = path;
  return new Promise<string>((resolve, reject) => {
    get(url, async function (response) {
      console.log(response.headers);
      const givenFileName = parseContentDisposition(
        response.headers["content-disposition"]
      );
      fileName = givenFileName ?? fileName;

      const file = createWriteStream(fileName);

      response.pipe(file);
      file.on("finish", function () {
        file.close(() => resolve(fileName));
      });
    }).on("error", function (err) {
      unlinkSync(fileName);
      reject();
    });
  });
}

async function readPdf(path: string): Promise<string> {
  const dataBuffer = readFileSync(path);
  const result = await pdf(dataBuffer);
  return result.text;
}

async function readDoc(path: string): Promise<string> {
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(path);
  return extracted.getBody();
}

async function recognizeImage(imagePath: string): Promise<string> {
  const result = await Tesseract.recognize(imagePath, "ces");
  return result.data.text;
}

async function main() {
  // const result = await recognizeImage(
  //   "https://www.ustavprava.cz/uploads/source/usa3.jpg"
  // );
  // console.log(result);

  console.log("downloading");
  const randomName = uniqueId();
  const path = await download(
    // "https://sbirkapp.gov.cz/detail/SPPGYQJQ3E23KIGC/text", // doc
    // "https://sbirkapp.gov.cz/detail/SPPI2RSJQFSTLW4I/text", // docx
    "https://sbirkapp.gov.cz/detail/SPPQBCN2CY42CL2A/text", // pdf
    // "https://sbirkapp.gov.cz/detail/SPP5JSAM5JZWC6I6/text", // pdf with images
    randomName
  );
  const type = await fileTypeFromFile(path);

  if (path === randomName) {
    // rename the file
    console.log("renaming");
    const newPath = `${randomName}.${type?.ext}`;
    renameSync(randomName, newPath);
  }
  console.log("done");

  if (type) {
    if (type.mime === "application/pdf") {
      console.log("PDF");
      console.log(await readPdf(path));
    } else if (
      type.mime === "application/x-cfb" ||
      type.mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log("DOC(X)");
      console.log(await readDoc(path));
    }
  }
}

main();
