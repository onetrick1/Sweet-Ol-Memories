const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'voicecare', '.env') });

const sql = postgres(process.env.POSTGRES_URL);

async function test() {
    try {
        console.log('Testing connection to:', process.env.POSTGRES_URL);
        const result = await sql`SELECT 1 as connected`;
        console.log('Connection successful:', result);

        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Tables in public schema:', tables.map(t => t.table_name));

        const users = await sql`SELECT * FROM users`;
        console.log('Users:', users);

        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

test();
