const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const Fuse = require('fuse.js');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const DB_PATH = path.join(__dirname, 'db.sqlite');
const db = new Database(DB_PATH);

// Init DB
db.exec(`
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  text TEXT,
  skills TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// In-memory index
let resumes = [];
let fuse = null;

function loadIndex() {
  const rows = db.prepare('SELECT * FROM resumes').all();
  resumes = rows.map(r => ({ id: r.id, name: r.name, email: r.email, text: r.text, skills: r.skills }));
  fuse = new Fuse(resumes, {
    keys: [
      { name: 'text', weight: 0.7 },
      { name: 'skills', weight: 0.3 },
      { name: 'name', weight: 0.1 }
    ],
    includeScore: true,
    threshold: 0.5,
  });
  console.log('Index loaded,', resumes.length, 'resumes');
}
loadIndex();

function extractSkills(text) {
  if (!text) return [];
  const known = ['JavaScript','TypeScript','React','Node','Express','Python','Django','FastAPI','SQL','PostgreSQL','MongoDB','AWS','Docker','Kubernetes','HTML','CSS','Git','TensorFlow','pandas','scikit-learn'];
  const found = [];
  const t = text.toLowerCase();
  known.forEach(k => {
    if (t.includes(k.toLowerCase())) found.push(k);
  });
  return found;
}

function snippetFromText(text, jd, len=200) {
  if (!text) return '';
  const firstWord = jd && jd.split(' ')[0] ? jd.split(' ')[0] : '';
  const idx = firstWord ? text.toLowerCase().indexOf(firstWord.toLowerCase()) : -1;
  if (idx === -1) return text.slice(0,len) + (text.length>len ? '...' : '');
  const start = Math.max(0, idx - 40);
  return (start>0 ? '...':'') + text.slice(start, start+len) + (text.length > start+len ? '...' : '');
}

// Create / update resume via JSON or file upload
app.post('/api/resumes', upload.single('file'), async (req, res) => {
  try {
    let name = req.body.name || null;
    let email = req.body.email || null;
    let text = req.body.text || '';
    if (req.file && req.file.mimetype === 'application/pdf') {
      const data = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(data);
      text = parsed.text + '\n' + text;
      // remove uploaded file
      try { fs.unlinkSync(req.file.path); } catch(e){}
    }
    const skillsArr = req.body.skills ? req.body.skills.split(',').map(s=>s.trim()).filter(Boolean) : extractSkills(text);
    const skills = skillsArr.join(',');
    const stmt = db.prepare('INSERT INTO resumes (name,email,text,skills) VALUES (?,?,?,?)');
    const info = stmt.run(name, email, text, skills);
    loadIndex();
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resumes', (req, res) => {
  const rows = db.prepare('SELECT id,name,email,skills,created_at FROM resumes ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/resumes/:id', (req, res) => {
  const row = db.prepare('SELECT id,name,email,text,skills,created_at FROM resumes WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

app.post('/api/match', (req, res) => {
  const { jd, top = 5 } = req.body;
  if (!jd) return res.status(400).json({ error: 'Provide job description in field "jd"' });
  if (!fuse) return res.json([]);
  const results = fuse.search(jd, { limit: top });
  const out = results.map(r => ({
    id: r.item.id,
    name: r.item.name,
    email: r.item.email,
    score: Math.round((1 - (r.score || 0)) * 100), // percent-like
    skills: r.item.skills,
    snippet: snippetFromText(r.item.text, jd)
  }));
  res.json(out);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
