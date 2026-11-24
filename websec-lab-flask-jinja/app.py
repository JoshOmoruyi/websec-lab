from flask import Flask,render_template,request,redirect,url_for,flash,jsonify
import core
app=Flask(__name__);app.secret_key='local-demo-only-change-for-deployment'
def form_data():return {k:request.form.get(k,'') for k in ('name','method','path','headers','body')}
@app.get('/')
def home():
    selected=request.args.get('id',type=int)
    item=core.get_case(selected) if selected else None
    return render_template('index.html',cases=core.rows('SELECT * FROM test_cases ORDER BY id DESC'),history=core.rows('SELECT * FROM test_runs ORDER BY id DESC LIMIT 20'),item=item or {'name':'Homepage Test','method':'GET','path':'/','headers':'{}','body':''},selected=selected)
@app.post('/save')
def save():
    try:
        id=request.form.get('id',type=int)
        item=core.update(id,form_data()) if id else core.create(form_data())
        if not item:flash('Test case not found','error');return redirect(url_for('home'))
        flash('Test case saved','success');return redirect(url_for('home',id=item['id']))
    except ValueError as e:flash(str(e),'error');return redirect(url_for('home'))
@app.post('/delete/<int:id>')
def remove(id):
    flash('Test case deleted' if core.delete(id) else 'Test case not found','success');return redirect(url_for('home'))
@app.post('/run')
def run():
    try:
        data=core.execute(form_data(),request.form.get('id',type=int))
        return render_template('result.html',result=data)
    except (ValueError,LookupError,ConnectionError) as e:return render_template('result.html',error=str(e)),400
@app.get('/api/health')
def health():return jsonify(status='ok',service='WebSec Lab Flask',target=core.TARGET)
@app.get('/api/test-cases')
def list_cases():return jsonify(core.rows('SELECT * FROM test_cases ORDER BY id DESC'))
@app.post('/api/test-cases')
def create_case():
    try:return jsonify(core.create(request.get_json(silent=True))),201
    except ValueError as e:return jsonify(error=str(e)),400
@app.put('/api/test-cases/<int:id>')
def update_case(id):
    try:
        item=core.update(id,request.get_json(silent=True))
        return (jsonify(item),200) if item else (jsonify(error='Test case not found'),404)
    except ValueError as e:return jsonify(error=str(e)),400
@app.delete('/api/test-cases/<int:id>')
def delete_case(id):return (jsonify(message='Test case deleted successfully'),200) if core.delete(id) else (jsonify(error='Test case not found'),404)
@app.get('/api/history')
def history():return jsonify(core.rows('SELECT * FROM test_runs ORDER BY id DESC LIMIT 20'))
@app.post('/api/run')
def run_api():
    try:
        data=request.get_json(silent=True)
        return jsonify(core.execute(data,data.get('testCaseId') if isinstance(data,dict) else None))
    except ValueError as e:return jsonify(error=str(e)),400
    except LookupError as e:return jsonify(error=str(e)),404
    except ConnectionError as e:return jsonify(error=str(e)),502
if __name__=='__main__':app.run(host='127.0.0.1',port=5000,debug=False)
