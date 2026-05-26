const Database = require('better-sqlite3');
const path = require('path');

// Initialize the SQLite database in the server directory
const dbPath = path.join(__dirname, 'overdrive.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Define the schema
const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_code TEXT PRIMARY KEY,
      state TEXT DEFAULT 'lobby',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT,
      device_token TEXT, -- A unique ID stored in the player's browser localStorage
      name TEXT,
      meat INTEGER DEFAULT 1,
      mind INTEGER DEFAULT 1,
      moxie INTEGER DEFAULT 1,
      health INTEGER DEFAULT 3,
      credits INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 1,
      FOREIGN KEY(room_code) REFERENCES rooms(room_code),
      UNIQUE(room_code, device_token)
    );

    CREATE TABLE IF NOT EXISTS players (
      device_token TEXT PRIMARY KEY,
      name TEXT,
      meat INTEGER DEFAULT 1,
      mind INTEGER DEFAULT 1,
      moxie INTEGER DEFAULT 1,
      health INTEGER DEFAULT 3,
      max_health INTEGER DEFAULT 3,
      credits INTEGER DEFAULT 0,
      gear TEXT DEFAULT '[]',
      status_effects TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS character_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_token TEXT,
      name TEXT,
      meat INTEGER DEFAULT 1,
      mind INTEGER DEFAULT 1,
      moxie INTEGER DEFAULT 1,
      health INTEGER DEFAULT 3,
      max_health INTEGER DEFAULT 3,
      credits INTEGER DEFAULT 0,
      gear TEXT DEFAULT '[]',
      status_effects TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add is_online to existing DBs if it doesn't exist
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN is_online INTEGER DEFAULT 1;`);
  } catch (err) {
    // Ignore error if column already exists
  }

  // Migration: add persistent fields to characters if missing
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN gear TEXT DEFAULT '[]';`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN status_effects TEXT DEFAULT '[]';`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN notes TEXT DEFAULT '';`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN max_health INTEGER DEFAULT 3;`);
  } catch (err) {}
};

initSchema();

module.exports = db;
