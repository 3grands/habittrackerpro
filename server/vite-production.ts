import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const frontendFiles = path.resolve("dist/public");
  
  if (!fs.existsSync(frontendFiles)) {
    log("Frontend build not found. Run build first.");
    return;
  }

  app.use(express.static(frontendFiles));
  
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(frontendFiles, "index.html"));
  });

  log("Serving static files from dist/public");
}