from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import hashlib
import json

app = Flask(__name__)
CORS(app)  # Cho phép tất cả domain

# Database in-memory (tạm thời) - sẽ mất khi restart app
users_db = {}
results_db = {}
careers_db = {
    1: {'id': 1, 'name': 'Công nghệ Thông tin', 'holland_codes': 'I', 'description': 'Ngành về phần mềm và máy móc tính', 'sample_careers': 'Lập trình viên, Kỹ sư phần mềm'},
    2: {'id': 2, 'name': 'Y tế', 'holland_codes': 'IS', 'description': 'Ngành chăm sóc sức khỏe', 'sample_careers': 'Bác sĩ, Y tá, Dược sĩ'},
    3: {'id': 3, 'name': 'Giáo dục', 'holland_codes': 'S', 'description': 'Ngành giảng dạy', 'sample_careers': 'Giáo viên, Giảng viên'},
    4: {'id': 4, 'name': 'Kinh doanh', 'holland_codes': 'E', 'description': 'Ngành quản trị và kinh doanh', 'sample_careers': 'Quản lý, Marketing, Kế toán'},
    5: {'id': 5, 'name': 'Nghệ thuật', 'holland_codes': 'A', 'description': 'Ngành sáng tạo', 'sample_careers': 'Thiết kế, Âm nhạc, Hội họa'}
}

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# API Routes
@app.route('/')
def home():
    return jsonify({"message": "Career Guide System API - Running on Render"})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "career-guide"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    user_type = data.get('user_type', 'student')
    
    if not all([username, password, full_name]):
        return jsonify({'error': 'Thiếu thông tin'}), 400
    
    if username in users_db:
        return jsonify({'error': 'Username đã tồn tại'}), 400
    
    user_id = len(users_db) + 1
    users_db[username] = {
        'id': user_id,
        'username': username,
        'password_hash': hash_password(password),
        'full_name': full_name,
        'user_type': user_type,
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({'success': True, 'user_id': user_id})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = users_db.get(username)
    
    if user and user['password_hash'] == hash_password(password):
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'full_name': user['full_name'],
                'user_type': user['user_type']
            }
        })
    else:
        return jsonify({'error': 'Sai username hoặc password'}), 401

@app.route('/api/holland-test', methods=['POST'])
def submit_holland_test():
    data = request.json
    user_id = data.get('user_id')
    scores = data.get('scores', {})
    
    # Lưu kết quả
    result_id = len(results_db) + 1
    results_db[result_id] = {
        'user_id': user_id,
        'scores': scores,
        'test_date': datetime.now().isoformat()
    }
    
    # Tính điểm
    holland_types = ['R', 'I', 'A', 'S', 'E', 'C']
    holland_scores = [scores.get(code, 0) for code in holland_types]
    max_score = max(holland_scores) if holland_scores else 0
    
    # Tìm nhóm chiếm ưu thế
    dominant_types = []
    for i, score in enumerate(holland_scores):
        if score == max_score:
            dominant_types.append(holland_types[i])
    
    # Đề xuất ngành nghề
    recommendations = []
    for career in careers_db.values():
        career_codes = career['holland_codes'] or ''
        match_count = sum(1 for code in career_codes if code in dominant_types)
        if match_count > 0:
            match_score = (match_count / len(career_codes)) * 100 if career_codes else 0
            recommendations.append({
                'career_id': career['id'],
                'name': career['name'],
                'description': career['description'],
                'sample_careers': career['sample_careers'],
                'match_score': round(match_score, 2)
            })
    
    # Sắp xếp theo điểm cao nhất
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    
    return jsonify({
        'success': True,
        'result_id': result_id,
        'dominant_types': dominant_types,
        'scores': scores,
        'recommendations': recommendations[:5]  # Top 5
    })

@app.route('/api/careers', methods=['GET'])
def get_careers():
    return jsonify(list(careers_db.values()))

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
        'trường': "Sau khi xác định ngành, em có thể tìm trường phù hợp qua:\n- Điểm chuẩn các năm\n- Chương trình đào tạo\n- Cơ sở vật chất\n- Tỷ lệ có việc làm",
        'hello': "Xin chào! Tôi là AI cố vấn hướng nghiệp. Tôi có thể giúp bạn tìm hiểu về ngành nghề phù hợp.",
        'test': "Bạn có thể làm bài trắc nghiệm Holland để biết sở thích nghề nghiệp của mình."
    }
    
    # Tìm response phù hợp
    response = "Tôi hiểu câu hỏi của bạn. Để tư vấn tốt hơn, bạn có thể:\n1. Làm bài trắc nghiệm sở thích\n2. Cho biết môn học bạn thích nhất\n3. Kể về sở thích cá nhân"
    
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
    app.run(host='0.0.0.0', port=port)
