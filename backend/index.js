const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./users.db');

// Create users table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT
  )`);
});

// GET all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// POST a new user
app.post('/api/users', (req, res) => {
  const { name, email, role, status } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO users (id, name, email, role, status) VALUES (?, ?, ?, ?, ?)`,
    [id, name, email, role, status],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id, name, email, role, status });
    }
  );
});

// PUT update a user
app.put('/api/users/:id', (req, res) => {
  const { name, email, role, status } = req.body;
  db.run(`UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?`,
    [name, email, role, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE a user
app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id=?`, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err });
    res.json({ deleted: this.changes });
  });
});

app.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});
