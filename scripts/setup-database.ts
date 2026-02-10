import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database...\n');

    // 1. Create challenge
    console.log('1️⃣ Creating challenge...');
    const challengeResult = await client.query(`
      INSERT INTO challenges (name, description, "startDate", "endDate", type, "isActive")
      VALUES (
        'Fitness2Witness Challenge',
        '12-week group fitness and faith challenge',
        '2026-02-10',
        '2026-05-04',
        'custom',
        true
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    const challengeId = challengeResult.rows[0]?.id || 1;
    console.log(`   ✓ Challenge created with ID: ${challengeId}`);

    // 2. Create group
    console.log('\n2️⃣ Creating group...');
    const groupResult = await client.query(`
      INSERT INTO groups (name, "challengeId", "isActive")
      VALUES (
        'Pilot Group',
        $1,
        true
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [challengeId]);
    
    const groupId = groupResult.rows[0]?.id || 1;
    console.log(`   ✓ Group created with ID: ${groupId}`);

    // 3. Update user (assign to group and set as admin)
    console.log('\n3️⃣ Updating user (Quay Merida)...');
    const userResult = await client.query(`
      UPDATE users
      SET "groupId" = $1, role = 'admin'
      WHERE id = 2
      RETURNING id, name, "groupId", role
    `, [groupId]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   ✓ User updated:`);
      console.log(`     - Name: ${user.name}`);
      console.log(`     - Group ID: ${user.groupId}`);
      console.log(`     - Role: ${user.role}`);
    } else {
      console.log('   ⚠️  No user with ID 2 found');
    }

    console.log('\n✅ Database setup complete!\n');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
