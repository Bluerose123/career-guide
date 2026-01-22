# app.py - Everything in one file
from flask import Flask, render_template_string
import os

app = Flask(__name__)

HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>Career Guide</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="card">
            <div class="card-body text-center">
                <h1>🎯 Career Guide AI</h1>
                <p class="text-muted">Hệ thống đang hoạt động!</p>
                <div class="alert alert-success">
                    <h5>Backend Status: <span id="status">✅ Online</span></h5>
                </div>
                <button class="btn btn-primary" onclick="testAPI()">Test API</button>
            </div>
        </div>
    </div>
    <script>
        function testAPI() {
            fetch('/api/health')
                .then(r => r.json())
                .then(d => alert('API Response: ' + JSON.stringify(d)));
        }
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    return render_template_string(HTML)

@app.route('/api/health')
def health():
    return {'status': 'ok', 'version': '1.0'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)