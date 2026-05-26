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
      FOREIGN KEY(room_code) REFERENCES rooms(room_code),
      UNIQUE(room_code, device_token)
    );
  `);
};

initSchema();

module.exports = db;
