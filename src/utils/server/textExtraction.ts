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
import { tmpdir } from "os";
import { join } from "path";
import { convert } from "pdf-img-convert";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import WordExtractor from "word-extractor";
import { TextExtractionResult } from "@/utils/shared/types";

function getFilePath(fileName: string) {
  return join(tmpdir(), fileName);
}

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

function download(url: string, fileName: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    get(url, async function (response) {
      console.log(response.headers);
      const givenFileName = parseContentDisposition(
        response.headers["content-disposition"]
      );
      fileName = givenFileName ?? fileName;

      const file = createWriteStream(getFilePath(fileName));

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

export async function extractText(url: string): Promise<TextExtractionResult> {
  const randomName = uniqueId();
  const fileName = await download(url, randomName);
  const path = getFilePath(fileName);
  const type = await fileTypeFromFile(path);

  if (!type) {
    return {
      text: null,
      fileType: null,
    };
  }

  // if the file name was not present in download link, rename with the correct extension
  if (path === randomName) {
    const newName = `${randomName}.${type.ext}`;
    renameSync(getFilePath(randomName), getFilePath(newName));
  }

  let text = "";

  if (type) {
    if (type.mime === "application/pdf") {
      text = await readPdf(path);

      if (text.length < 50) {
        text = "";
        const images = await extractImagesFromPdf(path);

        for (const image of images) {
          text += await recognizeImage(image);
        }
      }
    } else if (
      type.mime === "application/x-cfb" ||
      type.mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await readDoc(path);
    }
  }

  return {
    text: text.length >= 50 ? text : null,
    fileType: type,
  };
}
