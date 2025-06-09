import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static portfolio files
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'index.html'));
  });

  const httpServer = createServer(app);

  return httpServer;
}
