import type { Express } from "express";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function registerObjectStorageRoutes(app: Express): void {

  app.post("/api/uploads/direct", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Archivo no proporcionado" });
      }
      const contentType = req.file.mimetype || "application/octet-stream";
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${contentType};base64,${base64}`;
      res.json({ objectPath: dataUri });
    } catch (error) {
      console.error("Error in direct upload:", error);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  });
}
