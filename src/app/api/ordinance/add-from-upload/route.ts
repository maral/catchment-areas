import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";

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

const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    uploadMiddleware(req, res, () => {
      const { name, validFrom, validTo, serialNumber } = req.body;

      // Now you can use name, validFrom, validTo, serialNumber, and req.file for further processing...

      res.status(200).json({ message: "Upload successful" });
    });
  } else {
    res
      .status(405)
      .json({ error: "Method not allowed. Please send a POST request." });
  }
}
