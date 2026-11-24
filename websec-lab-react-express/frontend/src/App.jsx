import React, {useEffect,useState} from 'react';
import {ShieldCheck,Terminal,Database,Activity,Plus,Play,Save,Trash2,FilePenLine,RefreshCw,CheckCircle2,XCircle,Clock3,Code2,PanelLeftClose,LockKeyhole,ChevronRight,Info} from 'lucide-react';
const blank = {name:'Homepage Test',method:'GET',path:'/',headers:'{}',body:''};
async function api(url,options={}) {
  let response;
  try { response = await fetch(url,{...options,headers:{'Content-Type':'application/json',...options.headers}}); }
  catch { throw new Error('Cannot reach the backend. Start server.js on port 3001.'); }
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
function App(){
  const [view,setView]=useState('workbench');
  const [cases,setCases]=useState([]);
  const [history,setHistory]=useState([]);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState({...blank});
  const [result,setResult]=useState(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState(null);
  const [tab,setTab]=useState('body');
  const [connected,setConnected]=useState(false);
  const notify=(message,type='success')=>{setNotice({message,type});};
  async function refresh(){
    try { const [a,b]=await Promise.all([api('/api/test-cases'),api('/api/history')]); setCases(a);setHistory(b);setConnected(true); }
    catch(error){setConnected(false);notify(error.message,'error');}
  }
  useEffect(()=>{refresh();},[]);
  const update=(key,value)=>setForm(f=>({...f,[key]:value}));
  function choose(item){setSelected(item.id);setForm({name:item.name,method:item.method,path:item.path,headers:item.headers,body:item.body});setResult(null);setView('workbench');}
  function newCase(){setSelected(null);setForm({...blank,name:'New Test Case'});setResult(null);setView('workbench');}
  async function save(){
    setBusy(true);
    try {const item=await api(selected?`/api/test-cases/${selected}`:'/api/test-cases',{method:selected?'PUT':'POST',body:JSON.stringify(form)});setSelected(item.id);await refresh();notify(selected?'Test case updated':'Test case saved');}
    catch(error){notify(error.message,'error');} finally {setBusy(false);}
  }
  async function remove(){
    if(!selected) return;
    if(!window.confirm('Delete this saved test case?')) return;
    setBusy(true);
    try {await api(`/api/test-cases/${selected}`,{method:'DELETE'});setSelected(null);setForm({...blank});setResult(null);await refresh();notify('Test case deleted');}
    catch(error){notify(error.message,'error');} finally{setBusy(false);}
  }
  async function run(){
    setBusy(true);setResult(null);setTab('body');
    try {const data=await api('/api/run',{method:'POST',body:JSON.stringify({...form,...(selected?{testCaseId:selected}:{})})});setResult(data);await refresh();notify(`Request finished: HTTP ${data.status}`);}
    catch(error){notify(error.message,'error');} finally{setBusy(false);}
  }
  const score=result?Math.round(result.score/result.total*100):0;
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><ShieldCheck size={23}/></div><div><strong>WEBSEC<span> LAB</span></strong><small>SECURITY WORKBENCH</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav className="nav">
        <button className={view==='workbench'?'active':''} onClick={()=>setView('workbench')}><Terminal size={18}/> Request Builder <ChevronRight className="nav-arrow" size={16}/></button>
        <button className={view==='library'?'active':''} onClick={()=>setView('library')}><Database size={18}/> Saved Test Cases <span className="count">{cases.length}</span></button>
        <button className={view==='history'?'active':''} onClick={()=>setView('history')}><Activity size={18}/> Run History</button>
      </nav>
      <div className="side-label saved-label">QUICK ACCESS</div>
      <div className="quick-list">{cases.slice(0,5).map(c=><button key={c.id} className={selected===c.id?'chosen':''} onClick={()=>choose(c)}><span className={'method-dot '+c.method.toLowerCase()}></span><span className="truncate">{c.name}</span></button>)}{cases.length===0&&<p>No saved cases yet</p>}</div>
      <div className="sidebar-bottom"><div className="target-label"><LockKeyhole size={15}/> RESTRICTED TARGET</div><code>127.0.0.1:3002</code><p>Requests are limited to your local practice server.</p></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">WORKSPACE <ChevronRight size={13}/> <strong>{view==='workbench'?'Request Builder':view==='library'?'Saved Test Cases':'Run History'}</strong></div><div className="top-actions"><span className={'connection '+(connected?'online':'offline')}><span className="pulse"/>{connected?'API CONNECTED':'API OFFLINE'}</span><button className="icon-button" title="Refresh" onClick={refresh}><RefreshCw size={17}/></button></div></header>
      <div className="content">
        <div className="heading"><div><div className="eyebrow">LOCAL SECURITY TESTING ENVIRONMENT</div><h1>{view==='workbench'?'HTTP Request Builder':view==='library'?'Test Case Library':'Execution History'}</h1><p>{view==='workbench'?'Construct requests, inspect responses, and analyze defensive HTTP headers.':view==='library'?'Manage and reopen your saved HTTP test cases.':'Review the last 20 local practice requests.'}</p></div><div className="heading-actions"><button className="button secondary" onClick={newCase}><Plus size={17}/> New test case</button></div></div>
        {notice&&<div className={'notice '+notice.type}><span>{notice.type==='error'?<XCircle size={17}/>:<CheckCircle2 size={17}/>}</span><span>{notice.message}</span><button onClick={()=>setNotice(null)}>×</button></div>}
        {view==='workbench'&&<>
          <div className="stats"><div className="stat"><span>Saved cases</span><div><Database size={19}/><strong>{cases.length}</strong></div><small>Persistent SQLite storage</small></div><div className="stat"><span>Total runs</span><div><Activity size={19}/><strong>{history.length}</strong></div><small>Recent executions (up to 20)</small></div><div className="stat"><span>Last status</span><div><Terminal size={19}/><strong>{result?result.status:'—'}</strong></div><small>{result?`${result.durationMs} ms response time`:'Awaiting a request'}</small></div><div className="stat"><span>Security checks</span><div><ShieldCheck size={19}/><strong>{result?`${result.score}/${result.total}`:'—'}</strong></div><small>Header presence checks</small></div></div>
          <div className="work-grid"><section className="panel"><div className="panel-header"><div><div className="panel-kicker">01 / CONFIGURATION</div><h2>Request details</h2></div><span className="pill">{selected?`SAVED #${selected}`:'UNSAVED'}</span></div><div className="panel-body"><label>TEST CASE NAME<input value={form.name} maxLength={100} onChange={e=>update('name',e.target.value)} placeholder="e.g. Homepage Security Test"/></label><label>LOCAL TARGET <div className="target-box"><LockKeyhole size={15}/><span>http://127.0.0.1:3002</span><span className="target-tag">FIXED</span></div></label><div className="field-row"><label>METHOD<select value={form.method} onChange={e=>update('method',e.target.value)}><option>GET</option><option>POST</option></select></label><label>REQUEST PATH<input value={form.path} onChange={e=>update('path',e.target.value)} placeholder="/secure"/></label></div><label>REQUEST HEADERS <span className="label-hint">JSON · Accept, Content-Type, X-Demo-Label</span><textarea className="code-input" rows={4} value={form.headers} onChange={e=>update('headers',e.target.value)} spellCheck={false}/></label><label>REQUEST BODY <span className="label-hint">Optional · POST only</span><textarea className="code-input" rows={5} value={form.body} onChange={e=>update('body',e.target.value)} spellCheck={false} placeholder='{"hello":"world"}' disabled={form.method==='GET'}/></label><div className="form-actions"><button className="button primary" onClick={run} disabled={busy}><Play size={16} fill="currentColor"/>{busy?'Running…':'Send Request'}</button><button className="button secondary" onClick={save} disabled={busy}><Save size={16}/>{selected?'Update Case':'Save Case'}</button>{selected&&<button className="button danger-icon" title="Delete case" onClick={remove} disabled={busy}><Trash2 size={17}/></button>}</div></div></section>
          <div className="right-stack"><section className="panel response-panel"><div className="panel-header"><div><div className="panel-kicker">02 / INSPECTION</div><h2>Response viewer</h2></div>{result&&<span className={'status-pill '+(result.status<400?'good':'bad')}>HTTP {result.status}</span>}</div>{result?<><div className="response-meta"><span><CheckCircle2 size={15}/> {result.status} {result.statusText}</span><span><Clock3 size={15}/> {result.durationMs} ms</span></div><div className="tabs"><button className={tab==='body'?'selected':''} onClick={()=>setTab('body')}>Response body</button><button className={tab==='headers'?'selected':''} onClick={()=>setTab('headers')}>Headers</button></div><pre className="response-code">{tab==='body'?(result.body||'(empty response body)'):JSON.stringify(result.headers,null,2)}</pre>{result.truncated&&<div className="truncated">Response truncated at 64 KiB</div>}</>:<div className="empty"><div className="empty-icon"><Code2 size={27}/></div><strong>No response yet</strong><p>Configure your request and select “Send Request” to inspect the result.</p></div>}</section>
          <section className="panel security-panel"><div className="panel-header"><div><div className="panel-kicker">03 / SECURITY ANALYSIS</div><h2>Security header audit</h2></div>{result&&<strong className="score">{score}%</strong>}</div>{result?<><div className="score-track"><div style={{width:`${score}%`}}/></div><p className="score-caption">{result.score} of {result.total} common defensive headers detected. Presence does not guarantee secure configuration.</p><div className="checks">{result.checks.map(c=><div className="check" key={c.header}><span className={c.present?'check-icon present':'check-icon missing'}>{c.present?<CheckCircle2 size={18}/>:<XCircle size={18}/>}</span><div><strong>{c.label}</strong><small>{c.present?c.value:c.detail}</small></div><span className={c.present?'check-tag pass':'check-tag fail'}>{c.present?'PRESENT':'MISSING'}</span></div>)}</div></>:<div className="empty compact"><ShieldCheck size={29}/><strong>Ready to analyze</strong><p>Send a request to see security header checks and explanations.</p></div>}</section></div></div>
          <div className="footer-note"><Info size={16}/> Training only. All requests are restricted to the bundled local practice target. Header checks are educational heuristics, not a vulnerability assessment.</div>
        </>}
        {view==='library'&&<section className="panel list-panel"><div className="panel-header"><div><div className="panel-kicker">SQLITE DATABASE</div><h2>Saved configurations</h2></div><button className="button secondary small" onClick={refresh}><RefreshCw size={15}/> Refresh</button></div>{cases.length===0?<div className="empty"><Database size={30}/><strong>No saved test cases</strong><p>Use the Request Builder to create your first test case.</p></div>:<div className="table-scroll"><table><thead><tr><th>NAME</th><th>METHOD</th><th>PATH</th><th>CREATED</th><th></th></tr></thead><tbody>{cases.map(c=><tr key={c.id}><td><strong>{c.name}</strong><small>#{c.id}</small></td><td><span className={'method-badge '+c.method.toLowerCase()}>{c.method}</span></td><td><code>{c.path}</code></td><td>{c.created_at||'—'}</td><td><button className="table-action" onClick={()=>choose(c)}><FilePenLine size={15}/> Open</button></td></tr>)}</tbody></table></div>}</section>}
        {view==='history'&&<section className="panel list-panel"><div className="panel-header"><div><div className="panel-kicker">EXECUTION LOG</div><h2>Recent requests</h2></div><button className="button secondary small" onClick={refresh}><RefreshCw size={15}/> Refresh</button></div>{history.length===0?<div className="empty"><Activity size={30}/><strong>No requests recorded</strong><p>Send a request from the builder to populate your history.</p></div>:<div className="table-scroll"><table><thead><tr><th>TIME</th><th>METHOD</th><th>PATH</th><th>STATUS</th><th>LATENCY</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>{h.created_at}</td><td><span className={'method-badge '+h.method.toLowerCase()}>{h.method}</span></td><td><code>{h.path}</code></td><td><span className={h.status<400?'history-good':'history-bad'}>{h.status}</span></td><td>{h.duration_ms} ms</td></tr>)}</tbody></table></div>}</section>}
      </div>
    </main>
  </div>;
}
export default App;
