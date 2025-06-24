// ---------------------------
// db/conexion.js
// ---------------------------
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/usuarios.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;