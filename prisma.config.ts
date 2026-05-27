import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), then fall back to .env
config({ path: ".env.local", override: true });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI (migrate/studio/generate) всегда использует прямое соединение (Session mode).
    // Приложение использует DATABASE_URL отдельно, через adapter-pg в shared/lib/prisma.ts.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
