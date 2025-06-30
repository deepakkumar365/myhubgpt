import { config } from 'dotenv';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const inspectDatabase = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });

  try {

    
    // List all tables
    const tables = await connection`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    


    // Check if Chat table exists and its structure
    if (tables.some(t => t.table_name === 'Chat')) {

      const chatColumns = await connection`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Chat' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      chatColumns.forEach(col => {

      });

      // Check if there are any chats in the table
      const chatCount = await connection`SELECT COUNT(*) as count FROM "Chat"`;

    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  } finally {
    await connection.end();
  }
};

inspectDatabase().catch((err) => {
  console.error('❌ Inspection script failed');
  console.error(err);
  process.exit(1);
});