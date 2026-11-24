// Intentionally simple local-only target for demonstrating security headers.
const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'16kb'}));
app.get('/', (_req,res) => res.json({message:'Welcome to the WebSec Lab practice target', endpoints:['/','/secure','/echo','/status/404']}));
app.get('/secure', (_req,res) => {
  res.set({'Content-Security-Policy':"default-src 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=()'});
  res.json({message:'This route has several defensive security headers'});
});
app.get('/echo', (req,res) => res.json({method:req.method,path:req.path,query:req.query}));
app.post('/echo', (req,res) => res.json({method:req.method,path:req.path,body:req.body}));
app.get('/status/404', (_req,res) => res.status(404).json({message:'Demo not found'}));
app.listen(3002, '127.0.0.1', () => console.log('Practice target: http://127.0.0.1:3002'));
