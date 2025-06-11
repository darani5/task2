/*
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');



const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// SQLite setup
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error('Error opening database:', err);
  else console.log('Connected to SQLite DB');
});

// Create users table if it doesn't exist
const initQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL
  )
`;
db.run(initQuery);

// GET /api/users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/users
app.post('/api/users', (req, res) => {
  const { name, email, role, status } = req.body;
  const id = uuidv4();
  const query = 'INSERT INTO users (id, name, email, role, status) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [id, name, email, role, status], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, name, email, role, status });
  });
});

// PUT /api/users/:id
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;
  const query = 'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?';
  db.run(query, [name, email, role, status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name, email, role, status });
  });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted', id });
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
*/
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database (auto-creates if not present)
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error('❌ DB connection failed:', err);
  else console.log('✅ Connected to SQLite');
});

// Create users table with password field
const initQuery = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL
)
`;
db.run(initQuery, (err) => {
  if (err) console.error('❌ Table creation failed:', err);
  else console.log('✅ Users table is ready');
});

// POST /api/users - Create user
app.post('/api/users', async (req, res) => {
  const { name, email, password, role, status } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'Name, email, password, and role are required' });

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userStatus = status || 'active';

  const query = `
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [id, name, email, hashedPassword, role, userStatus], function (err) {
    if (err) {
      console.error('❌ Error creating user:', err.message);
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ User created with ID:', id);
    res.status(201).json({ id, name, email, role, status: userStatus });
  });
});

// GET /api/users - Get all users (excluding password)
app.get('/api/users', (req, res) => {
  const query = `SELECT id, name, email, role, status FROM users`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching users:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// PUT /api/users/:id - Update user (with optional password change)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !role || !status)
    return res.status(400).json({ message: 'Name, email, role, and status are required' });

  let query, params;

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    query = `
      UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?
    `;
    params = [name, email, hashedPassword, role, status, id];
  } else {
    query = `
      UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?
    `;
    params = [name, email, role, status, id];
  }

  db.run(query, params, function (err) {
    if (err) {
      console.error('❌ Error updating user:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id, name, email, role, status });
  });
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM users WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      console.error('❌ Error deleting user:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User deleted', id });
  });
});

// POST /api/login - Login user
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const query = `SELECT * FROM users WHERE email = ?`;

  db.get(query, [email], async (err, user) => {
    if (err) {
      console.error('❌ Login error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const { password: _, ...userData } = user;
    res.json({ user: userData });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

