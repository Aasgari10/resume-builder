import "./env"; // must be first so .env is loaded before other modules read process.env
import express from "express";
import { SECTION_KEYS } from "@rb/schema";
import { prisma } from "./db";
import { env } from "./env";
import { HttpError, errorHandler } from "./lib/http";
import { loadSession } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { publicRouter } from "./routes/public";
import { resumesRouter } from "./routes/resumes";
import { sitesRouter } from "./routes/sites";
import { templatesRouter } from "./routes/templates";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // behind a reverse proxy (Caddy/Nginx) in production

// Public sites first: they are served by host or by /s/<subdomain> and need no session.
app.use(publicRouter);

app.use(express.json({ limit: "1mb" }));
app.use(loadSession);

/** GET /api/health — server and database status. */
app.get("/api/health", async (_req, res) => {
  let db: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }
  res.json({ status: "ok", db, sections: SECTION_KEYS.length });
});

app.use("/api/auth", authRouter);
app.use("/api/resumes/:resumeId/site", sitesRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/templates", templatesRouter);

// Unknown /api routes
app.use("/api", (_req, _res, next) => {
  next(new HttpError(404, "NOT_FOUND", "مسیر پیدا نشد"));
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`✅ API ready: http://localhost:${env.port}/api/health`);
  if (env.otpDevEcho) console.log("ℹ️  Dev mode: login codes are printed here and returned by the API");
  if (env.rootDomain) console.log(`🌐 Sites: http://<subdomain>.${env.rootDomain}:${env.port}`);
});
