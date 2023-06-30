import { createCanvas } from "canvas";
import { fileTypeFromFile } from "file-type";
import {
  createWriteStream,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { get } from "https";
import { uniqueId } from "lodash";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import WordExtractor from "word-extractor";
import { convert } from "pdf-img-convert";

// 'https://sbirkapp.gov.cz/detail/SPPAVDN56WKCIHO6/text',

// todo:
// - [X] download the document
// - [X] identify type of document (docx/pdf)
// - [X] text PDF to text
// - [X] image PDF - extract images
// - [X] OCR extracted images
// - [X] DOCX to text

async function extractImagesFromPdf(pdfPath: string) {
  const outputImages = await convert(pdfPath);
  return outputImages.map((image, i) => {
    const path = "output" + i + ".png";
    writeFileSync(path, image);
    return path;
  });
}

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
    "https://sbirkapp.gov.cz/detail/SPPAVDN56WKCIHO6/text", // pdf
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
      const text = await readPdf(path);
      console.log(text);
      if (text.length < 100) {
        console.log("extracting images");
        const images = await extractImagesFromPdf(path);
        console.log(images);
        for (const image of images) {
          console.log("recognizing image");
          const result = await recognizeImage(image);
          console.log(result);
        }
      }
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
