// frontend/js/main.js
const API_BASE_URL = window.location.origin; // Sẽ tự động detect khi deploy

class CareerGuideApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.init();
    }
    
    async init() {
        // Kiểm tra nếu đã login
        const savedUser = localStorage.getItem('career_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }
    
    showLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <div class="card-body p-4">
                            <h3 class="text-center mb-4">
                                <i class="fas fa-robot text-primary me-2"></i>
                                CareerGuide AI
                            </h3>
                            
                            <div class="mb-3">
                                <button class="btn btn-outline-primary w-100 mb-2" onclick="app.showPage('login')">
                                    <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
                                </button>
                                <button class="btn btn-primary w-100" onclick="app.showPage('register')">
                                    <i class="fas fa-user-plus me-2"></i>Đăng ký
                                </button>
                            </div>
                            
                            <div id="authForm"></div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-3">
                        <p class="text-muted">Hệ thống AI hướng nghiệp cho học sinh THPT</p>
                    </div>
                </div>
            </div>
        `;
        
        this.showPage('login');
    }
    
    showPage(page) {
        this.currentPage = page;
        const authForm = document.getElementById('authForm');
        
        if (page === 'login') {
            authForm.innerHTML = `
                <h5 class="mb-3">Đăng nhập</h5>
                <div class="mb-3">
                    <label class="form-label">Tên đăng nhập</label>
                    <input type="text" class="form-control" id="loginUsername" placeholder="Nhập username">
                </div>
                <div class="mb-3">
                    <label class="form-label">Mật khẩu</label>
                    <input type="password" class="form-control" id="loginPassword" placeholder="Nhập mật khẩu">
                </div>
                <button class="btn btn-primary w-100" onclick="app.handleLogin()">
                    <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
                </button>
            `;
        } else {
            authForm.innerHTML = `
                <h5 class="mb-3">Đăng ký tài khoản</h5>
                <div class="mb-3">
                    <label class="form-label">Họ và tên</label>
                    <input type="text" class="form-control" id="regFullName" placeholder="Nguyễn Văn A">
                </div>
                <div class="mb-3">
                    <label class="form-label">Tên đăng nhập</label>
                    <input type="text" class="form-control" id="regUsername" placeholder="nguyenvana">
                </div>
                <div class="mb-3">
                    <label class="form-label">Mật khẩu</label>
                    <input type="password" class="form-control" id="regPassword" placeholder="Ít nhất 6 ký tự">
                </div>
                <div class="mb-3">
                    <label class="form-label">Loại tài khoản</label>
                    <select class="form-select" id="regUserType">
                        <option value="student">Học sinh</option>
                        <option value="teacher">Giáo viên</option>
                    </select>
                </div>
                <button class="btn btn-primary w-100" onclick="app.handleRegister()">
                    <i class="fas fa-user-plus me-2"></i>Đăng ký
                </button>
            `;
        }
    }
    
    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showAlert('Vui lòng nhập đầy đủ thông tin', 'danger');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('career_user', JSON.stringify(data.user));
                this.showDashboard();
                this.showAlert('Đăng nhập thành công!', 'success');
            } else {
                this.showAlert(data.error || 'Đăng nhập thất bại', 'danger');
            }
        } catch (error) {
            this.showAlert('Lỗi kết nối server', 'danger');
            console.error(error);
        }
    }
    
    async handleRegister() {
        const fullName = document.getElementById('regFullName').value;
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const userType = document.getElementById('regUserType').value;
        
        if (!fullName || !username || !password) {
            this.showAlert('Vui lòng nhập đầy đủ thông tin', 'danger');
            return;
        }
        
        if (password.length < 6) {
            this.showAlert('Mật khẩu phải có ít nhất 6 ký tự', 'danger');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, full_name: fullName, user_type: userType })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Đăng ký thành công! Vui lòng đăng nhập', 'success');
                this.showPage('login');
            } else {
                this.showAlert(data.error || 'Đăng ký thất bại', 'danger');
            }
        } catch (error) {
            this.showAlert('Lỗi kết nối server', 'danger');
            console.error(error);
        }
    }
    
    showDashboard() {
        const app = document.getElementById('app');
        const isStudent = this.currentUser.user_type === 'student';
        
        app.innerHTML = `
            <div class="row">
                <!-- Sidebar -->
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-user-circle me-2"></i>
                                ${this.currentUser.full_name}
                            </h5>
                            <p class="text-muted">${this.currentUser.user_type === 'student' ? '👨‍🎓 Học sinh' : '👨‍🏫 Giáo viên'}</p>
                            
                            <hr>
                            
                            <div class="nav flex-column">
                                ${isStudent ? `
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('tests')">
                                        <i class="fas fa-clipboard-list me-2"></i>Làm trắc nghiệm
                                    </button>
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('profile')">
                                        <i class="fas fa-chart-pie me-2"></i>Hồ sơ của tôi
                                    </button>
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('careers')">
                                        <i class="fas fa-briefcase me-2"></i>Ngành nghề
                                    </button>
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('chat')">
                                        <i class="fas fa-robot me-2"></i>Chat với AI
                                    </button>
                                ` : `
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('manage')">
                                        <i class="fas fa-cog me-2"></i>Quản lý hệ thống
                                    </button>
                                    <button class="btn btn-light text-start mb-2" onclick="app.showSection('reports')">
                                        <i class="fas fa-chart-bar me-2"></i>Báo cáo
                                    </button>
                                `}
                                <button class="btn btn-outline-danger mt-3" onclick="app.logout()">
                                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="col-md-9">
                    <div id="mainContent">
                        <div class="card">
                            <div class="card-body">
                                <h4>Chào mừng ${this.currentUser.full_name}!</h4>
                                <p class="text-muted">Hãy bắt đầu hành trình khám phá nghề nghiệp của bạn</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (isStudent) {
            this.showSection('tests');
        } else {
            this.showSection('manage');
        }
    }
    
    async showSection(section) {
        const mainContent = document.getElementById('mainContent');
        
        switch(section) {
            case 'tests':
                await this.showTests();
                break;
            case 'profile':
                await this.showProfile();
                break;
            case 'careers':
                await this.showCareers();
                break;
            case 'chat':
                this.showChat();
                break;
            case 'manage':
                this.showManage();
                break;
            default:
                mainContent.innerHTML = `<div class="alert alert-info">Đang tải...</div>`;
        }
    }
    
    async showTests() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0"><i class="fas fa-clipboard-check me-2"></i>Trắc nghiệm Holland</h4>
                </div>
                <div class="card-body">
                    <p>Trắc nghiệm giúp xác định sở thích nghề nghiệp dựa trên 6 nhóm tính cách:</p>
                    
                    <div class="row mb-4">
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-primary">R - Thực tế</strong>
                                <small class="d-block">Thích làm việc với công cụ, máy móc</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-success">I - Nghiên cứu</strong>
                                <small class="d-block">Thích khám phá, phân tích</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-warning">A - Nghệ thuật</strong>
                                <small class="d-block">Sáng tạo, độc lập</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-danger">S - Xã hội</strong>
                                <small class="d-block">Thích giúp đỡ, dạy học</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-info">E - Doanh nghiệp</strong>
                                <small class="d-block">Lãnh đạo, thuyết phục</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded">
                                <strong class="text-secondary">C - Công chức</strong>
                                <small class="d-block">Tổ chức, chi tiết</small>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary btn-lg" onclick="app.startHollandTest()">
                        <i class="fas fa-play-circle me-2"></i>Bắt đầu làm bài (20 câu)
                    </button>
                    
                    <div id="testContainer" class="mt-4"></div>
                </div>
            </div>
        `;
    }
    
    startHollandTest() {
        const testContainer = document.getElementById('testContainer');
        
        // Câu hỏi mẫu Holland (20 câu)
        const questions = [
            { id: 1, text: "Bạn thích sửa chữa đồ đạc trong nhà?", type: "R" },
            { id: 2, text: "Bạn thích nghiên cứu khoa học?", type: "I" },
            { id: 3, text: "Bạn thích vẽ, chụp ảnh hoặc sáng tác?", type: "A" },
            { id: 4, text: "Bạn thích giúp đỡ người khác?", type: "S" },
            { id: 5, text: "Bạn thích lãnh đạo nhóm?", type: "E" },
            { id: 6, text: "Bạn thích sắp xếp tài liệu ngăn nắp?", type: "C" },
            { id: 7, text: "Bạn thích làm việc ngoài trời?", type: "R" },
            { id: 8, text: "Bạn thích giải các bài toán khó?", type: "I" },
            { id: 9, text: "Bạn thích biểu diễn nghệ thuật?", type: "A" },
            { id: 10, text: "Bạn thích dạy học cho người khác?", type: "S" },
            { id: 11, text: "Bạn thích kinh doanh?", type: "E" },
            { id: 12, text: "Bạn thích làm việc với số liệu?", type: "C" },
            { id: 13, text: "Bạn thích lắp ráp mô hình?", type: "R" },
            { id: 14, text: "Bạn thích tìm hiểu nguyên lý hoạt động?", type: "I" },
            { id: 15, text: "Bạn thích viết văn, làm thơ?", type: "A" },
            { id: 16, text: "Bạn thích chăm sóc người ốm?", type: "S" },
            { id: 17, text: "Bạn thích thuyết phục người khác?", type: "E" },
            { id: 18, text: "Bạn thích lập kế hoạch chi tiết?", type: "C" },
            { id: 19, text: "Bạn thích sử dụng máy móc?", type: "R" },
            { id: 20, text: "Bạn thích phân tích vấn đề?", type: "I" }
        ];
        
        let currentQuestion = 0;
        const answers = {};
        
        function renderQuestion() {
            const q = questions[currentQuestion];
            const progress = ((currentQuestion + 1) / questions.length) * 100;
            
            testContainer.innerHTML = `
                <div class="test-question">
                    <div class="progress mb-3">
                        <div class="progress-bar" style="width: ${progress}%">
                            Câu ${currentQuestion + 1}/${questions.length}
                        </div>
                    </div>
                    
                    <h5 class="mb-4">${q.text}</h5>
                    
                    <div class="options">
                        <button class="option-btn ${answers[q.id] === 1 ? 'selected' : ''}" onclick="selectOption(${q.id}, 1)">
                            <i class="fas fa-times-circle me-2 text-danger"></i>Hoàn toàn không thích
                        </button>
                        <button class="option-btn ${answers[q.id] === 2 ? 'selected' : ''}" onclick="selectOption(${q.id}, 2)">
                            <i class="fas fa-minus-circle me-2 text-warning"></i>Không thích
                        </button>
                        <button class="option-btn ${answers[q.id] === 3 ? 'selected' : ''}" onclick="selectOption(${q.id}, 3)">
                            <i class="fas fa-circle me-2 text-secondary"></i>Bình thường
                        </button>
                        <button class="option-btn ${answers[q.id] === 4 ? 'selected' : ''}" onclick="selectOption(${q.id}, 4)">
                            <i class="fas fa-check-circle me-2 text-primary"></i>Thích
                        </button>
                        <button class="option-btn ${answers[q.id] === 5 ? 'selected' : ''}" onclick="selectOption(${q.id}, 5)">
                            <i class="fas fa-heart me-2 text-success"></i>Rất thích
                        </button>
                    </div>
                    
                    <div class="mt-4 d-flex justify-content-between">
                        <button class="btn btn-outline-secondary" ${currentQuestion === 0 ? 'disabled' : ''} onclick="prevQuestion()">
                            <i class="fas fa-arrow-left me-2"></i>Câu trước
                        </button>
                        
                        ${currentQuestion < questions.length - 1 ? 
                            `<button class="btn btn-primary" onclick="nextQuestion()">
                                Câu tiếp theo <i class="fas fa-arrow-right ms-2"></i>
                            </button>` :
                            `<button class="btn btn-success" onclick="submitTest()">
                                <i class="fas fa-paper-plane me-2"></i>Hoàn thành
                            </button>`
                        }
                    </div>
                </div>
            `;
            
            // Gắn hàm vào window để có thể gọi từ onclick
            window.selectOption = (qid, value) => {
                answers[qid] = value;
                renderQuestion();
            };
            
            window.prevQuestion = () => {
                if (currentQuestion > 0) {
                    currentQuestion--;
                    renderQuestion();
                }
            };
            
            window.nextQuestion = () => {
                if (currentQuestion < questions.length - 1) {
                    currentQuestion++;
                    renderQuestion();
                }
            };
            
            window.submitTest = async () => {
                // Tính điểm
                const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
                
                questions.forEach(q => {
                    if (answers[q.id]) {
                        scores[q.type] += answers[q.id];
                    }
                });
                
                // Gửi lên server
                try {
                    const response = await fetch(`${API_BASE_URL}/api/holland-test`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: app.currentUser.id,
                            scores: scores
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        app.showTestResults(data);
                    }
                } catch (error) {
                    console.error(error);
                    app.showAlert('Lỗi khi gửi bài làm', 'danger');
                }
            };
        }
        
        renderQuestion();
    }
    
    showTestResults(data) {
        const mainContent = document.getElementById('mainContent');
        const { dominant_types, recommendations } = data;
        
        // Chuẩn bị data cho chart
        const scores = [
            data.scores?.R || 0,
            data.scores?.I || 0,
            data.scores?.A || 0,
            data.scores?.S || 0,
            data.scores?.E || 0,
            data.scores?.C || 0
        ];
        
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Kết quả trắc nghiệm</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Biểu đồ sở thích nghề nghiệp</h5>
                            <div class="chart-container">
                                <canvas id="hollandChart"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5>Nhóm tính cách nổi bật</h5>
                            <div class="alert alert-info">
                                <h6><i class="fas fa-star me-2"></i>Nhóm chiếm ưu thế: ${dominant_types.join(', ')}</h6>
                                <p class="mb-0 mt-2">
                                    ${this.getHollandDescription(dominant_types[0])}
                                </p>
                            </div>
                            
                            <h5 class="mt-4">Đề xuất ngành nghề</h5>
                            ${recommendations.map(rec => `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <h6>${rec.name}</h6>
                                        <p class="text-muted small">${rec.description}</p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="badge bg-primary">
                                                Độ phù hợp: ${rec.match_score}%
                                            </span>
                                            <small>Ví dụ: ${rec.sample_careers}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="mt-4 text-center">
                        <button class="btn btn-primary" onclick="app.showSection('careers')">
                            <i class="fas fa-search me-2"></i>Xem chi tiết các ngành nghề
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Vẽ biểu đồ radar
        setTimeout(() => {
            this.drawHollandChart(scores);
        }, 100);
    }
    
    drawHollandChart(scores) {
        const ctx = document.getElementById('hollandChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Thực tế (R)', 'Nghiên cứu (I)', 'Nghệ thuật (A)', 'Xã hội (S)', 'Doanh nghiệp (E)', 'Công chức (C)'],
                datasets: [{
                    label: 'Điểm số',
                    data: scores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    getHollandDescription(code) {
        const descriptions = {
            'R': 'Thích làm việc với công cụ, máy móc, hoạt động thể chất. Phù hợp với nghề kỹ thuật, cơ khí, xây dựng.',
            'I': 'Thích nghiên cứu, phân tích, tìm tòi. Phù hợp với khoa học, công nghệ, y học, nghiên cứu.',
            'A': 'Sáng tạo, độc lập, biểu cảm. Phù hợp với nghệ thuật, thiết kế, văn học, âm nhạc.',
            'S': 'Thích giúp đỡ, dạy học, chăm sóc. Phù hợp với giáo dục, y tế, tâm lý, xã hội.',
            'E': 'Lãnh đạo, thuyết phục, kinh doanh. Phù hợp với quản lý, marketing, luật, bán hàng.',
            'C': 'Tổ chức, chi tiết, quy trình. Phù hợp với hành chính, kế toán, thư viện, phân tích dữ liệu.'
        };
        return descriptions[code] || 'Không có mô tả';
    }
    
    async showCareers() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/careers`);
            const careers = await response.json();
            
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h4 class="mb-0"><i class="fas fa-briefcase me-2"></i>Danh sách ngành nghề</h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${careers.map(career => `
                                <div class="col-md-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">${career.name}</h5>
                                            <p class="card-text">${career.description}</p>
                                            <div class="mb-2">
                                                <span class="badge bg-primary">Mã Holland: ${career.holland_codes}</span>
                                            </div>
                                            <h6>Ví dụ nghề nghiệp:</h6>
                                            <p class="text-muted">${career.sample_careers}</p>
                                            <button class="btn btn-sm btn-outline-primary" onclick="app.showCareerDetail(${career.id})">
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(error);
        }
    }
    
    showChat() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header bg-warning text-dark">
                    <h4 class="mb-0"><i class="fas fa-robot me-2"></i>Chat với AI Cố vấn</h4>
                </div>
                <div class="card-body p-0">
                    <div class="chat-container">
                        <div class="chat-messages" id="chatMessages">
                            <div class="message ai">
                                <strong><i class="fas fa-robot me-2"></i>AI Cố vấn:</strong>
                                <p>Xin chào! Tôi là AI cố vấn hướng nghiệp. Tôi có thể giúp gì cho bạn?</p>
                                <p class="small text-muted">Bạn có thể hỏi về: ngành nghề, chọn trường, cơ hội việc làm, hoặc bất kỳ thắc mắc nào về hướng nghiệp.</p>
                            </div>
                        </div>
                        <div class="chat-input">
                            <div class="input-group">
                                <input type="text" class="form-control" id="chatInput" 
                                       placeholder="Nhập câu hỏi của bạn..." 
                                       onkeypress="if(event.key === 'Enter') app.sendChatMessage()">
                                <button class="btn btn-primary" onclick="app.sendChatMessage()">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Hiển thị tin nhắn của người dùng
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML += `
            <div class="message user">
                <strong><i class="fas fa-user me-2"></i>Bạn:</strong>
                <p>${message}</p>
            </div>
        `;
        
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Gửi lên server
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/simple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            // Hiển thị phản hồi của AI
            setTimeout(() => {
                chatMessages.innerHTML += `
                    <div class="message ai">
                        <strong><i class="fas fa-robot me-2"></i>AI Cố vấn:</strong>
                        <p>${data.response.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 500);
            
        } catch (error) {
            console.error(error);
            chatMessages.innerHTML += `
                <div class="message ai">
                    <strong><i class="fas fa-robot me-2"></i>AI Cố vấn:</strong>
                    <p>Xin lỗi, tôi gặp sự cố kết nối. Vui lòng thử lại sau.</p>
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    showManage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header bg-secondary text-white">
                    <h4 class="mb-0"><i class="fas fa-cog me-2"></i>Quản lý hệ thống (Giáo viên)</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-users fa-3x text-primary mb-3"></i>
                                    <h5>Quản lý người dùng</h5>
                                    <p class="text-muted">Xem danh sách học sinh, tạo tài khoản</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-briefcase fa-3x text-success mb-3"></i>
                                    <h5>Quản lý ngành nghề</h5>
                                    <p class="text-muted">Thêm/sửa/xóa thông tin ngành nghề</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-chart-bar fa-3x text-warning mb-3"></i>
                                    <h5>Báo cáo thống kê</h5>
                                    <p class="text-muted">Xem báo cáo xu hướng chọn ngành</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-info mt-4">
                        <h6><i class="fas fa-info-circle me-2"></i>Chức năng giáo viên đang phát triển</h6>
                        <p class="mb-0">Các tính năng quản trị sẽ được cập nhật trong phiên bản tiếp theo.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const app = document.getElementById('app');
        app.prepend(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    logout() {
        localStorage.removeItem('career_user');
        this.currentUser = null;
        this.showLogin();
    }
}

// Khởi tạo app
window.app = new CareerGuideApp();