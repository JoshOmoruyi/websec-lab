from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import core
app=FastAPI(title='WebSec Lab FastAPI',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://127.0.0.1:5174','http://localhost:5174'],allow_credentials=False,allow_methods=['GET','POST','PUT','DELETE'],allow_headers=['Content-Type'])
class TestCase(BaseModel):
    name:str;method:str;path:str;headers:str='{}';body:str=''
class RunCase(TestCase):
    testCaseId:Optional[int]=None
@app.get('/api/health')
def health():return {'status':'ok','service':'WebSec Lab FastAPI','target':core.TARGET}
@app.get('/api/test-cases')
def list_cases():return core.rows('SELECT * FROM test_cases ORDER BY id DESC')
@app.post('/api/test-cases',status_code=201)
def create_case(data:TestCase):
    try:return core.create(data.model_dump())
    except ValueError as e:raise HTTPException(400,str(e))
@app.put('/api/test-cases/{id}')
def update_case(id:int,data:TestCase):
    try:
        item=core.update(id,data.model_dump())
        if not item:raise HTTPException(404,'Test case not found')
        return item
    except ValueError as e:raise HTTPException(400,str(e))
@app.delete('/api/test-cases/{id}')
def delete_case(id:int):
    if not core.delete(id):raise HTTPException(404,'Test case not found')
    return {'message':'Test case deleted successfully'}
@app.get('/api/history')
def history():return core.rows('SELECT * FROM test_runs ORDER BY id DESC LIMIT 20')
@app.post('/api/run')
def run(data:RunCase):
    try:return core.execute(data.model_dump(),data.testCaseId)
    except ValueError as e:raise HTTPException(400,str(e))
    except LookupError as e:raise HTTPException(404,str(e))
    except ConnectionError as e:raise HTTPException(502,str(e))
