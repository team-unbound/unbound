import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' ORDER BY table_name`;
console.log("TABLES:", tables.map((t) => t.table_name).join(", "));

const cols = await sql`
  SELECT table_name, count(*)::int AS n FROM information_schema.columns
  WHERE table_schema='public' GROUP BY table_name ORDER BY table_name`;
console.log("COLUMNS:", cols.map((c) => `${c.table_name}=${c.n}`).join(" "));

const idx = await sql`
  SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname`;
console.log("INDEXES:\n  " + idx.map((i) => i.indexname).join("\n  "));

const enums = await sql`
  SELECT t.typname, string_agg(e.enumlabel, '|' ORDER BY e.enumsortorder) AS vals
  FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid GROUP BY t.typname`;
console.log("ENUMS:", enums.map((e) => `${e.typname}(${e.vals})`).join(", "));

const checks = await sql`
  SELECT conname FROM pg_constraint WHERE contype='c'
  AND connamespace='public'::regnamespace`;
console.log("CHECKS:", checks.map((c) => c.conname).join(", "));
