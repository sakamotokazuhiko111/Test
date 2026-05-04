const Database = require('better-sqlite3');
const path = require('path');
const migrate = require('../database/migrate');

const db = new Database(path.join(__dirname, '../database/employees.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

migrate(db);

module.exports = db;
