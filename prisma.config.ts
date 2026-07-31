import "dotenv/config";
import { defineConfig } from "prisma/config";

// Neon gives you two connection strings. Migrations must use the *direct*
// (non-pooled) one — the pooled endpoint cannot hold the advisory lock that
// `prisma migrate` takes. The app itself uses the pooled DATABASE_URL.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Set DIRECT_URL (preferred) or DATABASE_URL in .env before running Prisma CLI commands.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
