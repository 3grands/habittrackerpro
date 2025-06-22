import express, { type Express } from "express"
import fs from "fs"
import path from "path"
import { createServer as createViteServer, createLogger } from "vite"
import { nanoid } from "nanoid"

const viteLogger = createLogger()

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  })
  console.log(`${formattedTime} [${source}] ${message}`)
}

export async function setupVite(app: Express, server: any) {
  if (process.env.NODE_ENV === "production") return

  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, opts) => {
        viteLogger.error(msg, opts)
        process.exit(1)
      }
    },
    appType: "custom"
  })

  app.use(vite.middlewares)
  app.use("*", async (req, res, next) => {
    try {
      // point at the root index.html now
      const templatePath = path.resolve(process.cwd(), "index.html")
      let template = await fs.promises.readFile(templatePath, "utf-8")
      // cache-busting if you like:
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      )
      const html = await vite.transformIndexHtml(req.originalUrl, template)
      res.status(200).set({ "Content-Type": "text/html" }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
}
