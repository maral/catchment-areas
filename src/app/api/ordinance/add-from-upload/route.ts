import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

// Define Multer settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    fs.exists(dir, (exist) => {
      if (!exist) {
        return fs.mkdir(dir, (error) => cb(error, dir));
      }
      return cb(null, dir);
    });
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /docx|rtf|doc|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Error: Only the following filetypes are allowed: .DOC, .DOCX, .RTF, .PDF!"
      )
    );
  },
});

const uploadMiddleware = (req: any, next: any) => {
  // upload.single("file")(req, (err: any) => {
  //   if (err) {
  //     return res.status(500).json({ error: err.message });
  //   }
  //   next();
  // });
};

export function POST(req: NextRequest) {
  uploadMiddleware(req, async () => {
    const { name, validFrom, validTo, serialNumber } = await req.json();

    // Now you can use name, validFrom, validTo, serialNumber, and req.file for further processing...

    NextResponse.json({ message: "Upload successful" });
  });
}
