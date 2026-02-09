/**
 * Database Module - sql.js (pure JavaScript SQLite)
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'mbg_workforce.db');

let db = null;

/**
 * Initialize database
 */
async function initDb() {
  try {
    const SQL = await initSqlJs();

    // Load existing database or create new
    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('[Database] Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('[Database] Created new database');
    }

    // Run schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.run(schema);

    // Save to file
    saveDb();

    console.log('[Database] Initialized successfully');
  } catch (err) {
    console.error('[Database] Initialization error:', err);
    throw err;
  }
}

/**
 * Save database to file
 */
function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[Database] Save error:', err);
  }
}

/**
 * Run a query that returns results
 */
function query(sql, params = []) {
  if (!db) {
    console.error('[Database] Not initialized');
    return [];
  }

  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();

    return results;
  } catch (err) {
    console.error('[Database] Query error:', err);
    return [];
  }
}

/**
 * Run a statement that doesn't return results
 */
function run(sql, params = []) {
  if (!db) {
    console.error('[Database] Not initialized');
    return;
  }

  try {
    db.run(sql, params);
    saveDb();
  } catch (err) {
    console.error('[Database] Run error:', err);
  }
}

/**
 * Get database instance
 */
function getDb() {
  return db;
}

// Initialize on import
await initDb();

export default { query, run, getDb, initDb };
