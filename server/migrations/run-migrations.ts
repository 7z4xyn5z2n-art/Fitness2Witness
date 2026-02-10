import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple database migration runner
 * - Reads .sql files from migrations directory
 * - Tracks executed migrations in schema_migrations table
 * - Runs pending migrations in order
 * - No external dependencies needed (just pg)
 */

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Starting database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Get list of already executed migrations
    const executedResult = await pool.query(
      'SELECT name FROM schema_migrations ORDER BY name'
    );
    const executedMigrations = new Set(executedResult.rows.map(row => row.name));
    
    // Read all .sql files from migrations directory
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical order ensures 001, 002, 003, etc. run in sequence
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    let ranCount = 0;
    
    for (const file of files) {
      const migrationName = file.replace('.sql', '');
      
      // Skip if already executed
      if (executedMigrations.has(migrationName)) {
        console.log(`✓ ${migrationName} (already executed)`);
        continue;
      }
      
      // Read and execute the migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`Running ${migrationName}...`);
      
      try {
        // Execute migration in a transaction
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [migrationName]
        );
        await pool.query('COMMIT');
        
        console.log(`✓ ${migrationName} completed`);
        ranCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`✗ ${migrationName} failed:`, error);
        throw error;
      }
    }
    
    if (ranCount === 0) {
      console.log('All migrations already executed. Database is up to date.');
    } else {
      console.log(`\nSuccessfully ran ${ranCount} migration(s)`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
