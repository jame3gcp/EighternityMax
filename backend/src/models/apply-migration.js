import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    const migrationPath = path.join(__dirname, '../../drizzle/0005_admin_cms_expansion.sql');
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    const statements = content.split('--> statement-breakpoint');
    
    console.log(`Running ${statements.length} migration statements...`);
    
    for (let statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      
      console.log(`Executing: ${trimmed.substring(0, 50)}...`);
      await sql.unsafe(trimmed);
    }
    
    console.log('✅ Migration applied successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

run();
