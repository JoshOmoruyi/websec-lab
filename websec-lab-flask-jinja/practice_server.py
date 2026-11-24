"""Safe loopback-only practice HTTP target, port 3002."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
class Handler(BaseHTTPRequestHandler):
    def reply(self,status,obj,secure=False):
        data=json.dumps(obj).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)))
        if secure:
            for k,v in [('Content-Security-Policy',"default-src 'none'"),('X-Content-Type-Options','nosniff'),('X-Frame-Options','DENY'),('Referrer-Policy','no-referrer'),('Permissions-Policy','camera=(), microphone=()')]:self.send_header(k,v)
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        p=self.path.split('?')[0]
        if p=='/':self.reply(200,{'message':'Welcome to the WebSec Lab practice target','endpoints':['/','/secure','/echo','/status/404']})
        elif p=='/secure':self.reply(200,{'message':'Defensive headers enabled'},True)
        elif p=='/echo':self.reply(200,{'method':'GET','path':self.path})
        elif p=='/status/404':self.reply(404,{'message':'Demo not found'})
        else:self.reply(404,{'message':'Unknown route'})
    def do_POST(self):
        if self.path.split('?')[0]!='/echo':return self.reply(404,{'message':'Unknown route'})
        n=int(self.headers.get('Content-Length','0'))
        if n>16384:return self.reply(413,{'error':'Body too large'})
        data=self.rfile.read(n).decode('utf-8','replace');self.reply(200,{'method':'POST','path':self.path,'body':data})
if __name__=='__main__':
    print('Practice target: http://127.0.0.1:3002');ThreadingHTTPServer(('127.0.0.1',3002),Handler).serve_forever()
