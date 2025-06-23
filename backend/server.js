const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- Initialize SQLite DB ---
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite');
});

// --- Create Tables ---
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK(status IN ('To Do', 'In Progress', 'Done')),
      deadline TEXT,
      tags TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      comments TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
});

// --- User APIs ---
app.post('/api/users', async (req, res) => {
  const { name, email, password, role, status } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'Name, email, password, and role are required' });

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userStatus = status || 'active';

  const query = `INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [id, name, email, hashedPassword, role, userStatus], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint'))
        return res.status(400).json({ error: 'Email already exists' });
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, name, email, role, status: userStatus });
  });
});

app.get('/api/users', (req, res) => {
  db.all(`SELECT id, name, email, role, status FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  let query, params;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    query = `UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?`;
    params = [name, email, hashedPassword, role, status, id];
  } else {
    query = `UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?`;
    params = [name, email, role, status, id];
  }

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name, email, role, status });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted', id: req.params.id });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const { password: _, ...userData } = user;
    res.json({ user: userData });
  });
});

// --- Project APIs ---
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });

  const id = uuidv4();
  db.run(`INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`,
    [id, name, description || ''], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, description: description || '' });
    });
});

app.put('/api/projects/:id', (req, res) => {
  const { name, description } = req.body;
  db.run(`UPDATE projects SET name = ?, description = ? WHERE id = ?`,
    [name, description || '', req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, name, description: description || '' });
    });
});

app.delete('/api/projects/:id', (req, res) => {
  db.run(`DELETE FROM projects WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project deleted', id: req.params.id });
  });
});

// --- Task APIs ---
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { projectId, title, description, status, deadline, tags, completed, comments } = req.body;
  if (!projectId || !title || !status)
    return res.status(400).json({ message: 'projectId, title and status are required' });

  const id = uuidv4();
  db.run(
    `INSERT INTO tasks (id, projectId, title, description, status, deadline, tags, completed, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, projectId, title, description || '', status, deadline || '', tags || '', completed ? 1 : 0, comments || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, projectId, title, description, status, deadline, tags, completed, comments });
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const { projectId, title, description, status, deadline, tags, completed, comments } = req.body;
  const query = `
    UPDATE tasks 
    SET projectId = ?, title = ?, description = ?, status = ?, deadline = ?, tags = ?, completed = ?, comments = ?
    WHERE id = ?
  `;
  const values = [projectId, title, description || '', status, deadline || '', tags || '', completed ? 1 : 0, comments || '', req.params.id];

  db.run(query, values, function (err) {
    if (err) {
      console.error('❌ Error updating task:', err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json({ id: req.params.id, projectId, title, description, status, deadline, tags, completed, comments });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted', id: req.params.id });
  });
});

// --- Email Reminder ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sendDeadlineReminders() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const query = `
    SELECT 
      t.title, 
      t.description as taskDescription, 
      t.status,
      t.deadline, 
      p.name as projectName
    FROM tasks t
    LEFT JOIN projects p ON t.projectId = p.id
    WHERE DATE(t.deadline) = ?
  `;

  db.all(query, [dateStr], (err, tasks) => {
    if (err) return console.error('❌ Failed to fetch tasks for email:', err);
    if (tasks.length === 0) return console.log('📭 No tasks due tomorrow');

    let htmlContent = `
      <h2>📌 Tasks Due Tomorrow (${dateStr})</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead style="background-color: #f2f2f2;">
          <tr><th>Title</th><th>Description</th><th>Project</th><th>Status</th><th>Deadline</th></tr>
        </thead><tbody>
    `;

    tasks.forEach(({ title, taskDescription, projectName, status, deadline }) => {
      htmlContent += `<tr>
        <td>${title}</td>
        <td>${taskDescription || '-'}</td>
        <td>${projectName || '-'}</td>
        <td>${status}</td>
        <td>${deadline}</td>
      </tr>`;
    });

    htmlContent += '</tbody></table>';

    const mailOptions = {
      from: `"Task Manager" <${process.env.SMTP_USER}>`,
      to: process.env.REMINDER_EMAIL,
      subject: `📌 Tasks Due Tomorrow (${dateStr})`,
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return console.error('❌ Email send failed:', error);
      console.log(`📧 Reminder sent to ${process.env.REMINDER_EMAIL}: ${info.response}`);
    });
  });
}

cron.schedule('45 20 * * *', sendDeadlineReminders, {
  timezone: process.env.TIMEZONE || 'UTC',
});

app.get('/test-send-email', (req, res) => {
  sendDeadlineReminders();
  res.send('Triggered email reminder manually');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
