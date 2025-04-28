import { TextExtractionResult } from "@/utils/shared/types";
import { fileTypeFromFile } from "file-type";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { writeFile } from "fs/promises";
import { get } from "https";
import { uniqueId } from "lodash";
import { join } from "path";
import { convert } from "pdf-img-convert";
import pdf from "pdf-parse";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import WordExtractor from "word-extractor";
import officeParser from "officeparser";

async function extractImagesFromPdf(pdfPath: string) {
  pdfjs.GlobalWorkerOptions.workerSrc =
    "pdfjs-dist/legacy/build/pdf.worker.mjs";

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
      const givenFileName = parseContentDisposition(
        response.headers["content-disposition"]
      );
      fileName = createUniqueFileName(givenFileName ?? fileName);

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
  const worker = await createWorker({
    workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
  });
  await worker.loadLanguage("ces");
  await worker.initialize("ces");
  const {
    data: { text },
  } = await worker.recognize(imagePath);
  await worker.terminate();
  return text;
}

function getDirectoryPath(): string {
  const directoryPath = join(".", "data", "ordinances");
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true });
  }
  return directoryPath;
}

export function getFilePath(fileName: string): string {
  return join(getDirectoryPath(), fileName);
}

function createUniqueFileName(fileName: string): string {
  return `${Date.now()}_${fileName}`;
}

function getEmptyResponse(): TextExtractionResult {
  return {
    text: null,
    fileName: null,
    fileType: null,
  };
}

async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = createUniqueFileName(file.name);
  await writeFile(getFilePath(fileName), new Uint8Array(buffer));
  return fileName;
}

async function downloadFileFromUrl(url: string): Promise<string | null> {
  const randomName = uniqueId();
  let fileName = await download(url, randomName);
  const path = getFilePath(fileName);
  const type = await fileTypeFromFile(path);

  if (!type) {
    return null;
  }

  // if the file name was not present in download link, rename with the correct extension
  if (fileName === randomName) {
    fileName = `${randomName}.${type.ext}`;
    renameSync(getFilePath(randomName), getFilePath(fileName));
  }

  return fileName;
}

export async function uploadAndExtractText(
  file: File
): Promise<TextExtractionResult> {
  const fileName = await uploadFile(file);
  if (!fileName) {
    return getEmptyResponse();
  }
  return await extractText(fileName);
}

export async function downloadAndExtractText(
  url: string
): Promise<TextExtractionResult> {
  const fileName = await downloadFileFromUrl(url);
  if (!fileName) {
    return getEmptyResponse();
  }
  return await extractText(fileName);
}

async function extractText(fileName: string): Promise<TextExtractionResult> {
  const path = getFilePath(fileName);
  const type = await fileTypeFromFile(path);

  if (!type) {
    return getEmptyResponse();
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

        // remove images after processing
        for (const image of images) {
          unlinkSync(image);
        }
      }
    } else if (
      type.mime === "application/x-cfb" ||
      type.mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await readDoc(path);
    } else {
      try {
        text = await officeParser.parseOfficeAsync(path);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return {
    text: text.length >= 50 ? text : null,
    fileName,
    fileType: type,
  };
}
