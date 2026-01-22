# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import hashlib

app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Cho phép tất cả domain

# Database setup
DB_PATH = 'database/career_guide.db'

def init_database():
    """Khởi tạo database nếu chưa có"""
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Tạo bảng users
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT,
                user_type TEXT CHECK(user_type IN ('student', 'teacher', 'admin')),
                class TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tạo bảng holland_results
        cursor.execute('''
            CREATE TABLE holland_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                realistic INTEGER DEFAULT 0,
                investigative INTEGER DEFAULT 0,
                artistic INTEGER DEFAULT 0,
                social INTEGER DEFAULT 0,
                enterprising INTEGER DEFAULT 0,
                conventional INTEGER DEFAULT 0,
                test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tạo bảng career_groups
        cursor.execute('''
            CREATE TABLE career_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                holland_codes TEXT,
                description TEXT,
                sample_careers TEXT,
                is_active INTEGER DEFAULT 1
            )
        ''')
        
        # Thêm dữ liệu mẫu
        sample_careers = [
            ('Công nghệ Thông tin', 'I', 'Ngành về phần mềm và máy tính', 'Lập trình viên, Kỹ sư phần mềm, Quản trị mạng'),
            ('Y tế', 'IS', 'Ngành chăm sóc sức khỏe', 'Bác sĩ, Y tá, Dược sĩ'),
            ('Giáo dục', 'S', 'Ngành giảng dạy', 'Giáo viên, Giảng viên, Tư vấn viên'),
            ('Kinh doanh', 'E', 'Ngành quản trị và kinh doanh', 'Quản lý, Marketing, Kế toán'),
            ('Nghệ thuật', 'A', 'Ngành sáng tạo', 'Thiết kế, Âm nhạc, Hội họa'),
            ('Kỹ thuật', 'R', 'Ngành kỹ thuật và xây dựng', 'Kỹ sư cơ khí, Xây dựng, Điện tử')
        ]
        
        cursor.executemany(
            'INSERT INTO career_groups (name, holland_codes, description, sample_careers) VALUES (?, ?, ?, ?)',
            sample_careers
        )
        
        conn.commit()
        conn.close()
        print("✅ Database đã được khởi tạo!")

# Khởi tạo database khi start app
init_database()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# API Routes
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    user_type = data.get('user_type', 'student')
    
    if not all([username, password, full_name]):
        return jsonify({'error': 'Thiếu thông tin'}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, password_hash, full_name, user_type) VALUES (?, ?, ?, ?)',
            (username, hash_password(password), full_name, user_type)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return jsonify({'success': True, 'user_id': user_id})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username đã tồn tại'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM users WHERE username = ? AND password_hash = ?',
        (username, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'user': dict(user)
        })
    else:
        return jsonify({'error': 'Sai username hoặc password'}), 401

@app.route('/api/holland-test', methods=['POST'])
def submit_holland_test():
    data = request.json
    user_id = data.get('user_id')
    scores = data.get('scores')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO holland_results 
        (user_id, realistic, investigative, artistic, social, enterprising, conventional)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        scores.get('R', 0),
        scores.get('I', 0),
        scores.get('A', 0),
        scores.get('S', 0),
        scores.get('E', 0),
        scores.get('C', 0)
    ))
    
    # Tính điểm và đề xuất
    holland_scores = [scores.get(code, 0) for code in ['R', 'I', 'A', 'S', 'E', 'C']]
    max_score = max(holland_scores)
    dominant_types = []
    
    for i, score in enumerate(holland_scores):
        if score == max_score:
            dominant_types.append(['R', 'I', 'A', 'S', 'E', 'C'][i])
    
    # Lấy career recommendations
    cursor.execute('''
        SELECT * FROM career_groups 
        WHERE is_active = 1
    ''')
    all_careers = cursor.fetchall()
    
    recommendations = []
    for career in all_careers:
        career_codes = career['holland_codes'] or ''
        match_count = sum(1 for code in career_codes if code in dominant_types)
        if match_count > 0:
            match_score = (match_count / len(career_codes)) * 100
            recommendations.append({
                'career_id': career['id'],
                'name': career['name'],
                'description': career['description'],
                'sample_careers': career['sample_careers'],
                'match_score': round(match_score, 2)
            })
    
    # Sắp xếp theo điểm cao nhất
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    
    conn.commit()
    result_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'success': True,
        'result_id': result_id,
        'dominant_types': dominant_types,
        'recommendations': recommendations[:5]  # Top 5
    })

@app.route('/api/careers', methods=['GET'])
def get_careers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM career_groups WHERE is_active = 1')
    careers = cursor.fetchall()
    conn.close()
    return jsonify([dict(career) for career in careers])

@app.route('/api/chat/simple', methods=['POST'])
def chat_simple():
    """Chatbot đơn giản rule-based"""
    data = request.json
    message = data.get('message', '').lower()
    
    responses = {
        'toán': "Nếu em không giỏi Toán, đừng lo lắng! Có nhiều ngành nghề không yêu cầu Toán cao như: Ngôn ngữ, Nghệ thuật, Xã hội, Du lịch...",
        'lương': "Mức lương phụ thuộc vào năng lực và thị trường. Quan trọng là chọn nghề phù hợp với sở thích và khả năng của mình.",
        'thất nghiệp': "Không ngành nào đảm bảo 100% việc làm. Nhưng nếu có kỹ năng tốt và không ngừng học hỏi, cơ hội sẽ luôn rộng mở.",
        'chọn ngành': "Em nên:\n1. Làm bài trắc nghiệm sở thích\n2. Xem điểm mạnh học tập\n3. Tham khảo ý kiến giáo viên\n4. Tìm hiểu thực tế công việc",
        'nghề': "Các nhóm nghề phổ biến:\n- Công nghệ: Lập trình viên, Thiết kế web\n- Y tế: Bác sĩ, Y tá\n- Giáo dục: Giáo viên, Giảng viên\n- Kinh doanh: Marketing, Kế toán",
        'trường': "Sau khi xác định ngành, em có thể tìm trường phù hợp qua:\n- Điểm chuẩn các năm\n- Chương trình đào tạo\n- Cơ sở vật chất\n- Tỷ lệ có việc làm"
    }
    
    # Tìm response phù hợp
    response = "Tôi hiểu câu hỏi của em. Để tư vấn tốt hơn, em có thể:\n1. Làm bài trắc nghiệm sở thích\n2. Cho biết môn học em thích nhất\n3. Kể về sở thích cá nhân"
    
    for keyword, resp in responses.items():
        if keyword in message:
            response = resp
            break
    
    return jsonify({
        'response': response,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)