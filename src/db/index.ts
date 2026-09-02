import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const PLACEHOLDER = "postgresql://user:password@host.neon.tech/dbname?sslmode=require";

const connectionString = process.env.DATABASE_URL ?? "";

/**
 * True once a real Neon URL is in `.env.local`. Pages check this so the site
 * still renders (with an empty//disabled state) before the database exists.
 */
export const isDatabaseConfigured =
  connectionString.length > 0 && connectionString !== PLACEHOLDER;

let cached: ReturnType<typeof create> | null = null;

function create() {
  if (!isDatabaseConfigured) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }
  return drizzle(neon(connectionString), { schema });
}

/** Lazily built so importing this module never throws without a DB. */
export function getDb() {
  cached ??= create();
  return cached;
}

export { schema };
