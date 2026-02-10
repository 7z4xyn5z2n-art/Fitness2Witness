import pg from 'pg';
const { Pool } = pg;

/**
 * Production migration runner - embeds SQL directly (no file reading needed)
 * This file is standalone and can run with just Node.js + pg package
 */

const migrations = {
  '001_initial_schema': `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  group_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMP
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Add foreign key for users.group_id
ALTER TABLE users ADD CONSTRAINT fk_users_group 
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_group ON check_ins(group_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON check_ins(date);
CREATE INDEX IF NOT EXISTS idx_groups_challenge ON groups(challenge_id);
`,

  '002_setup_initial_data': `
-- Insert default challenge if it doesn't exist
INSERT INTO "challenges" ("name", "startDate", "endDate", "active")
SELECT 'Fitness2Witness Challenge', '2026-02-10'::timestamp, '2026-05-04'::timestamp, true
WHERE NOT EXISTS (
  SELECT 1 FROM "challenges" WHERE "name" = 'Fitness2Witness Challenge'
);

-- Insert default group if it doesn't exist
INSERT INTO "groups" ("groupName", "challengeId")
SELECT 'Pilot Group', c."id"
FROM "challenges" c
WHERE c."name" = 'Fitness2Witness Challenge'
  AND NOT EXISTS (
    SELECT 1 FROM "groups" g WHERE g."groupName" = 'Pilot Group'
  );

-- Update existing users to assign them to the pilot group
UPDATE "users"
SET "groupId" = (
  SELECT "id" FROM "groups" WHERE "groupName" = 'Pilot Group' LIMIT 1
)
WHERE "groupId" IS NULL;

-- Set user ID 2 (Quay Merida) as admin
UPDATE "users"
SET "role" = 'admin'
WHERE "id" = 2;
`
};

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔄 Starting database migrations...');
    
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Get executed migrations
    const executedResult = await pool.query(
      'SELECT name FROM schema_migrations ORDER BY name'
    );
    const executedMigrations = new Set(executedResult.rows.map(row => row.name));
    
    const migrationNames = Object.keys(migrations).sort();
    let ranCount = 0;
    
    for (const name of migrationNames) {
      if (executedMigrations.has(name)) {
        console.log(`✓ ${name} (already executed)`);
        continue;
      }
      
      const sql = migrations[name];
      console.log(`🔄 Running ${name}...`);
      
      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [name]
        );
        await pool.query('COMMIT');
        
        console.log(`✅ ${name} completed`);
        ranCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ ${name} failed:`, error);
        throw error;
      }
    }
    
    if (ranCount === 0) {
      console.log('✅ All migrations already executed. Database is up to date.');
    } else {
      console.log(`✅ Successfully ran ${ranCount} migration(s)`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
