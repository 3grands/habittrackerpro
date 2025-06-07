import { db } from './server/db.js';
import { habits } from './shared/schema.js';

async function testDB() {
  try {
    const result = await db.select().from(habits).limit(1);
    console.log('Database connection successful:', result.length, 'habits found');
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

testDB();