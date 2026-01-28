import 'dotenv/config';
import { db } from './src/models/db.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('🔍 Testing Supabase Database connection...');
  try {
    const result = await db.execute(sql`SELECT current_database(), current_user, version();`);
    console.log('✅ Connection successful!');
    console.log('📊 Database Info:', result);
    
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('📁 Existing Tables in public schema:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    if (tables.length === 0) {
      console.log('⚠️  No tables found. You might need to run "npm run db:push".');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testConnection();
