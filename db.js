// server/db.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");


const db = new sqlite3.Database(path.join(__dirname, "database.db"), (err) => {
  if (err) {
    console.error("Error opening database: " + err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});


db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating users table: " + err.message);
      }
    }
  );


  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      status TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("Error creating tasks table: " + err.message);
      }
    }
  );
});


module.exports = db;
