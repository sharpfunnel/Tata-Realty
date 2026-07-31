import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Next.js hot-reloads modules in dev, and each serverless invocation may reuse a
// warm container. Without this singleton every reload opens a fresh pool and
// Postgres runs out of connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your Neon pooled connection string.",
    );
  }

  // Prisma 7 requires a driver adapter. `pg` pools internally; keep the pool
  // small because Vercel runs many concurrent lambdas against one database.
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
