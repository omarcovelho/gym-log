import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// Match Nest ConfigModule: .env.local overrides .env
config({ path: resolve(__dirname, '.env.local') });
config({ path: resolve(__dirname, '.env') });

// Use dummy URL during build if DATABASE_URL is not available
// prisma generate doesn't need a real connection, just a valid URL format
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

// schema.prisma uses env("DATABASE_URL") — ensure it is set for CLI validation
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
});
