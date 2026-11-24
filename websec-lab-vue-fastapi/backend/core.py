"""Shared local-only WebSec Lab data and request-testing logic."""
import json, re, sqlite3, time, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlsplit
DB = Path(__file__).resolve().parent / 'websec.db'
TARGET='http://127.0.0.1:3002'
CHECKS=[('content-security-policy','Content Security Policy','Restricts resource loading'),('x-content-type-options','X-Content-Type-Options','Prevents MIME sniffing'),('x-frame-options','X-Frame-Options','Legacy framing protection'),('referrer-policy','Referrer Policy','Controls Referer disclosure'),('permissions-policy','Permissions Policy','Limits browser features')]
ALLOWED_HEADERS={'accept','content-type','x-demo-label'}
def connect():
    c=sqlite3.connect(DB, timeout=5);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c
def init():
    with connect() as c:
        c.executescript("""CREATE TABLE IF NOT EXISTS test_cases (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,headers TEXT NOT NULL DEFAULT '{}',body TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS test_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,test_case_id INTEGER,method TEXT NOT NULL,path TEXT NOT NULL,status INTEGER,duration_ms INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL);""")
def normalize(data):
    if not isinstance(data,dict): raise ValueError('JSON object required')
    out={k:data.get(k) for k in ('name','method','path','headers','body')}
    if out['headers'] is None:out['headers']='{}'
    if out['body'] is None:out['body']=''
    if not isinstance(out['name'],str) or not out['name'].strip() or len(out['name'])>100:raise ValueError('Name must be 1–100 characters')
    out['name']=out['name'].strip()
    if out['method'] not in ('GET','POST'):raise ValueError('Method must be GET or POST')
    path=out['path']
    if not isinstance(path,str) or not path.startswith('/') or path.startswith('//') or '\\' in path or '#' in path or any(ord(ch)<32 for ch in path) or len(path)>300:raise ValueError('Use a local relative path starting with /')
    if not isinstance(out['headers'],str) or len(out['headers'])>4000:raise ValueError('Headers must be a JSON string under 4000 characters')
    if not isinstance(out['body'],str) or len(out['body'])>8000:raise ValueError('Body must be a string under 8000 characters')
    try: headers=json.loads(out['headers'])
    except (ValueError,TypeError):raise ValueError('Headers must be valid JSON')
    if not isinstance(headers,dict):raise ValueError('Headers must be a JSON object')
    for k,v in headers.items():
        if k.lower() not in ALLOWED_HEADERS or not isinstance(v,str) or len(v)>500 or '\r' in v or '\n' in v:raise ValueError('Only Accept, Content-Type, and X-Demo-Label string headers are allowed')
    return out,headers
def rows(sql,args=()):
    with connect() as c:return [dict(x) for x in c.execute(sql,args).fetchall()]
def get_case(id):
    with connect() as c:
        row=c.execute('SELECT * FROM test_cases WHERE id=?',(id,)).fetchone()
        return dict(row) if row else None
def create(data):
    out,_=normalize(data)
    with connect() as c:
        cur=c.execute('INSERT INTO test_cases (name,method,path,headers,body) VALUES (:name,:method,:path,:headers,:body)',out)
        return dict(c.execute('SELECT * FROM test_cases WHERE id=?',(cur.lastrowid,)).fetchone())
def update(id,data):
    out,_=normalize(data)
    with connect() as c:
        cur=c.execute('UPDATE test_cases SET name=:name,method=:method,path=:path,headers=:headers,body=:body WHERE id=:id',{**out,'id':id})
        if not cur.rowcount:return None
        return dict(c.execute('SELECT * FROM test_cases WHERE id=?',(id,)).fetchone())
def delete(id):
    with connect() as c:return c.execute('DELETE FROM test_cases WHERE id=?',(id,)).rowcount>0
def execute(data,test_case_id=None):
    out,headers=normalize(data)
    if test_case_id is not None and not get_case(test_case_id):raise LookupError('Saved test case not found')
    # No external hosts, no user-supplied origin, no redirect following.
    path=out['path']; parsed=urlsplit(path)
    if parsed.scheme or parsed.netloc:raise ValueError('Only local relative paths are allowed')
    url=TARGET+path
    payload=out['body'].encode('utf-8') if out['method']=='POST' else None
    req=urllib.request.Request(url,method=out['method'],data=payload,headers=headers)
    start=time.monotonic()
    opener=urllib.request.build_opener(NoRedirect)
    try:
        response=opener.open(req,timeout=5)
    except urllib.error.HTTPError as e:response=e
    except (urllib.error.URLError,TimeoutError,OSError) as e:raise ConnectionError('Could not reach the local practice server on port 3002') from e
    try:
        status=response.status;status_text=response.reason
        rh={k.lower():v for k,v in response.headers.items()}
        content=response.read(65537);truncated=len(content)>65536
        content=content[:65536].decode('utf-8',errors='replace')
    finally:response.close()
    elapsed=round((time.monotonic()-start)*1000)
    checks=[{'header':k,'label':label,'detail':detail,'present':k in rh,'value':rh.get(k)} for k,label,detail in CHECKS]
    with connect() as c:c.execute('INSERT INTO test_runs (test_case_id,method,path,status,duration_ms) VALUES (?,?,?,?,?)',(test_case_id,out['method'],path,status,elapsed))
    return {'status':status,'statusText':status_text,'durationMs':elapsed,'url':url,'headers':rh,'body':content,'truncated':truncated,'checks':checks,'score':sum(x['present'] for x in checks),'total':len(checks)}
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):return None
init()
