import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use dummy URL during build if DATABASE_URL is not available
// prisma generate doesn't need a real connection, just a valid URL format
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
