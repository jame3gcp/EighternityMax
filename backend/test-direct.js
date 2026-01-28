import postgres from 'postgres';
import 'dotenv/config';

async function testDirectConnection() {
  const url = process.env.DATABASE_URL;
  console.log('🔗 Attempting to connect to:', url.replace(/:[^@:]+@/, ':****@'));
  
  const sql = postgres(url, {
    ssl: 'require',
    connect_timeout: 10,
  });

  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('✅ Direct connection successful:', result);
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Suggestion: The hostname might be incorrect or DNS is not propagated. Try using the IP pooler address from Supabase dashboard.');
    }
  } finally {
    await sql.end();
    process.exit(0);
  }
}

testDirectConnection();
