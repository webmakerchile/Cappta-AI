import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const objectStorageService = new ObjectStorageService();
const isProduction = process.env.NODE_ENV === "production" || !!process.env.REPL_DEPLOYMENT;

export function registerObjectStorageRoutes(app: Express): void {

  app.post("/api/uploads/direct", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Archivo no proporcionado" });
      }
      const ext = path.extname(req.file.originalname || "") || getExtFromMime(req.file.mimetype);
      const contentType = req.file.mimetype || "application/octet-stream";

      if (isProduction) {
        const objectPath = await objectStorageService.uploadFileDirect(
          req.file.buffer,
          contentType,
          ext
        );
        res.json({ objectPath });
      } else {
        const objectId = randomUUID() + ext;
        const filePath = path.join(UPLOAD_DIR, objectId);
        fs.writeFileSync(filePath, req.file.buffer);
        const objectPath = `/objects/uploads/${objectId}`;
        res.json({ objectPath });
      }
    } catch (error) {
      console.error("Error in direct upload:", error);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  });

  app.use("/objects", async (req, res, next) => {
    if (req.method !== "GET") return next();
    try {
      if (isProduction) {
        const objectPath = `/objects${req.path}`;
        const signedUrl = await objectStorageService.getSignedDownloadUrl(objectPath);
        const fetchHeaders: Record<string, string> = {};
        if (req.headers.range) {
          fetchHeaders["Range"] = req.headers.range;
        }
        const upstream = await fetch(signedUrl, { headers: fetchHeaders });
        if (!upstream.ok && upstream.status !== 206) {
          return res.status(upstream.status).json({ error: "Archivo no encontrado" });
        }
        res.status(upstream.status);
        const fwdHeaders = ["content-type", "content-length", "accept-ranges", "content-range", "etag", "last-modified"];
        for (const h of fwdHeaders) {
          const val = upstream.headers.get(h);
          if (val) res.set(h, val);
        }
        res.set("Cache-Control", "public, max-age=86400");
        if (upstream.body) {
          const { Readable } = await import("stream");
          const nodeStream = Readable.fromWeb(upstream.body as any);
          nodeStream.pipe(res);
        } else {
          res.end();
        }
      } else {
        const reqPath = req.path.replace(/^\/uploads\//, "");
        const filePath = path.join(UPLOAD_DIR, reqPath);
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
          return res.status(403).json({ error: "Acceso prohibido" });
        }
        if (!fs.existsSync(resolved)) {
          return res.status(404).json({ error: "Archivo no encontrado" });
        }
        const ext = path.extname(resolved).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
          ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
          ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
          ".pdf": "application/pdf",
        };
        res.set("Content-Type", mimeMap[ext] || "application/octet-stream");
        res.set("Cache-Control", "public, max-age=3600");
        const stream = fs.createReadStream(resolved);
        stream.pipe(res);
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Error al servir archivo" });
    }
  });
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/plain": ".txt",
    "text/csv": ".csv",
  };
  return map[mime] || "";
}
