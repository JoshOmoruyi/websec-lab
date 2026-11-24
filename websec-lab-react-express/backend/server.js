const express = require('express');
const db = require('./database');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
const PORT = 3001;
const TARGET = 'http://127.0.0.1:3002'; // Fixed local practice target. Never accept a user-supplied origin.
const ALLOWED_METHODS = new Set(['GET','POST']);
const ALLOWED_HEADERS = new Set(['accept','content-type','x-demo-label']);

function validateTestCase(data) {
  if (!data || typeof data !== 'object') return 'A JSON object is required';
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100) return 'Name must be 1–100 characters';
  if (!ALLOWED_METHODS.has(data.method)) return 'Method must be GET or POST';
  if (typeof data.path !== 'string' || !/^\/(?!\/)[^\r\n\\]*$/.test(data.path) || data.path.length > 300 || data.path.includes('#')) return 'Path must be a local relative path starting with /';
  if (typeof data.headers !== 'string' || data.headers.length > 4000) return 'Headers must be a JSON string under 4000 characters';
  if (typeof data.body !== 'string' || data.body.length > 8000) return 'Body must be a string under 8000 characters';
  let headers;
  try { headers = JSON.parse(data.headers); } catch { return 'Headers must contain valid JSON'; }
  if (!headers || Array.isArray(headers) || typeof headers !== 'object') return 'Headers must be a JSON object';
  for (const [key,value] of Object.entries(headers)) {
    if (!ALLOWED_HEADERS.has(key.toLowerCase()) || typeof value !== 'string' || /[\r\n]/.test(value) || value.length > 500) return 'Only Accept, Content-Type, and X-Demo-Label string headers are allowed';
  }
  return null;
}
function normalize(data) {
  return {name:data.name.trim(),method:data.method,path:data.path,headers:data.headers ?? '{}',body:data.body ?? ''};
}
function respondError(res,error) { console.error(error); return res.status(500).json({error:'Database error'}); }

app.get('/api/health', (_req,res) => res.json({status:'ok',service:'WebSec Lab API',target:TARGET}));
app.get('/api/test-cases', (_req,res) => {
  try { res.json(db.prepare('SELECT * FROM test_cases ORDER BY id DESC').all()); }
  catch(error) { respondError(res,error); }
});
app.post('/api/test-cases', (req,res) => {
  const data = normalize(req.body || {});
  const issue = validateTestCase(data);
  if (issue) return res.status(400).json({error:issue});
  try {
    const result = db.prepare('INSERT INTO test_cases (name, method, path, headers, body) VALUES (?, ?, ?, ?, ?)').run(data.name,data.method,data.path,data.headers,data.body);
    res.status(201).json(db.prepare('SELECT * FROM test_cases WHERE id = ?').get(result.lastInsertRowid));
  } catch(error) { respondError(res,error); }
});
app.put('/api/test-cases/:id', (req,res) => {
  const data = normalize(req.body || {});
  const issue = validateTestCase(data);
  if (issue) return res.status(400).json({error:issue});
  try {
    const result = db.prepare('UPDATE test_cases SET name=?, method=?, path=?, headers=?, body=? WHERE id=?').run(data.name,data.method,data.path,data.headers,data.body,req.params.id);
    if (!result.changes) return res.status(404).json({error:'Test case not found'});
    res.json(db.prepare('SELECT * FROM test_cases WHERE id=?').get(req.params.id));
  } catch(error) { respondError(res,error); }
});
app.delete('/api/test-cases/:id', (req,res) => {
  try {
    const result = db.prepare('DELETE FROM test_cases WHERE id=?').run(req.params.id);
    if (!result.changes) return res.status(404).json({error:'Test case not found'});
    res.json({message:'Test case deleted successfully'});
  } catch(error) { respondError(res,error); }
});
app.get('/api/history', (_req,res) => {
  try { res.json(db.prepare('SELECT * FROM test_runs ORDER BY id DESC LIMIT 20').all()); }
  catch(error) { respondError(res,error); }
});
const CHECKS = [
  {header:'content-security-policy',label:'Content Security Policy',detail:'Restricts where a page can load resources from.'},
  {header:'x-content-type-options',label:'X-Content-Type-Options',detail:'Helps prevent MIME type sniffing.'},
  {header:'x-frame-options',label:'X-Frame-Options',detail:'Legacy defense against unwanted framing.'},
  {header:'referrer-policy',label:'Referrer Policy',detail:'Controls information sent in Referer headers.'},
  {header:'permissions-policy',label:'Permissions Policy',detail:'Restricts access to selected browser features.'}
];
app.post('/api/run', async (req,res) => {
  const {testCaseId} = req.body || {};
  const data = normalize(req.body || {});
  const issue = validateTestCase(data);
  if (issue) return res.status(400).json({error:issue});
  if (testCaseId != null) {
    if (!Number.isSafeInteger(testCaseId) || testCaseId < 1) return res.status(400).json({error:'Invalid test case ID'});
    if (!db.prepare('SELECT id FROM test_cases WHERE id=?').get(testCaseId)) return res.status(404).json({error:'Saved test case not found'});
  }
  // Enforce a single, fixed loopback target and disallow redirects.
  const url = new URL(data.path, TARGET);
  if (url.origin !== TARGET || url.username || url.password) return res.status(400).json({error:'Only the fixed local practice target is allowed'});
  const headers = JSON.parse(data.headers);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const start = Date.now();
  try {
    const response = await fetch(url, {method:data.method,headers,body:data.method === 'POST' ? data.body : undefined,redirect:'manual',signal:controller.signal});
    const durationMs = Date.now() - start;
    const responseHeaders = Object.fromEntries(response.headers.entries());
    // Limit response payloads to 64 KiB.
    const reader = response.body?.getReader();
    let chunks = [], bytes = 0, truncated = false;
    if (reader) {
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        if (bytes + value.length > 65536) { chunks.push(value.slice(0,65536-bytes)); truncated = true; await reader.cancel(); break; }
        chunks.push(value); bytes += value.length;
      }
    }
    const text = new TextDecoder().decode(Buffer.concat(chunks.map(x=>Buffer.from(x))));
    const checks = CHECKS.map(c=>({...c,present:response.headers.has(c.header),value:response.headers.get(c.header)}));
    db.prepare('INSERT INTO test_runs (test_case_id, method, path, status, duration_ms) VALUES (?, ?, ?, ?, ?)').run(testCaseId ?? null,data.method,data.path,response.status,durationMs);
    res.json({status:response.status,statusText:response.statusText,durationMs,url:url.toString(),headers:responseHeaders,body:text,truncated,checks,score:checks.filter(c=>c.present).length,total:checks.length});
  } catch(error) {
    if (error.name === 'AbortError') return res.status(504).json({error:'Local target timed out'});
    console.error('Local request failed:',error.message);
    return res.status(502).json({error:'Could not connect to the local practice target. Start practice-server.js on port 3002.'});
  } finally { clearTimeout(timer); }
});
app.listen(PORT,'127.0.0.1',()=>console.log(`WebSec Lab API: http://127.0.0.1:${PORT}`));
