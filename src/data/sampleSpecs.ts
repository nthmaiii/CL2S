import { FullSRS } from '../types';

export const SAMPLE_SRS_SPEC: FullSRS = {
  projectOverview: {
    name: 'Enterprise Auth & Identity Service (Legacy)',
    slogan: 'Dịch vụ xác thực phân tán, quản lý phiên đăng nhập và bảo vệ dữ liệu khách hàng',
    description: 'Hệ thống phụ trợ (Backend Subsystem) xử lý quy trình đăng ký, xác thực đa yếu tố, phân quyền theo vai trò (RBAC) và kiểm toán an ninh. Mã nguồn được phát triển trên nền tảng Spring Boot kết hợp Hibernate JPA và MySQL, chưa từng có tài liệu SRS chính thức trước khi được CL2S quét và tái dựng.',
    techStackDetected: [
      { name: 'Java 17 / Spring Boot', version: '2.7.14', category: 'Framework', confidence: 99.8 },
      { name: 'MySQL / InnoDB', version: '8.0+', category: 'Database', confidence: 99.5 },
      { name: 'Spring Data JPA / Hibernate', version: '5.6', category: 'ORM', confidence: 98.9 },
      { name: 'BCrypt & JWT (JSON Web Tokens)', version: '0.9.1', category: 'Security', confidence: 99.2 },
      { name: 'Maven Build Architecture', version: '3.8+', category: 'Build Tool', confidence: 97.4 }
    ],
    metrics: {
      totalFilesScanned: 12432,
      relevantFilesCount: 4,
      ignoredFilesCount: 12428,
      totalLinesOfCode: 243,
      reconstructionConfidence: 99.5,
      cacheTtlMinutes: 60,
      estimatedTokensSaved: 85400
    },
    architecturalStyle: 'Layered Architecture (Controller -> Service -> Repository -> RDBMS)',
    securityFindingsSummary: [
      'Phát hiện thuật toán băm mật khẩu chuẩn BCrypt với độ trễ Cost Factor 12 tại UserService.java',
      'Đã lọc bỏ an toàn 3 tệp nhạy cảm (.env, private_key.pem, credentials.json) trước khi đưa vào ngữ cảnh Gemini',
      'Cơ chế chặn brute-force tự động khóa sau 5 lần nhập sai liên tiếp được mã hóa cứng',
      'Khóa ngoại tự động cascade xóa Refresh Tokens khi User bị xóa hoàn toàn khỏi hệ thống'
    ]
  },
  useCases: [
    {
      id: 'UC-001',
      name: 'Đăng ký tài khoản khách hàng mới',
      actor: 'Khách hàng chưa định danh (Guest)',
      confidence: 'HIGH',
      preCondition: 'Người dùng cung cấp thông tin gồm username, email hợp lệ, mật khẩu thô và số điện thoại.',
      postCondition: 'Hệ thống tạo bản ghi mới ở trạng thái ACTIVE, băm mật khẩu bằng BCrypt, lưu vào DB và trả về Access Token.',
      mainFlow: [
        '1. Khách hàng gửi yêu cầu POST tới /api/v1/auth/register kèm payload JSON.',
        '2. UserController tiếp nhận và gọi hàm userService.registerNewAccount().',
        '3. UserService kiểm tra tính tồn tại của email qua userRepository.existsByEmail(email).',
        '4. Nếu email đã tồn tại, ném lỗi EmailAlreadyExistsException.',
        '5. Nếu hợp lệ, hệ thống sinh muối băm BCrypt cost 12 và mã hóa password.',
        '6. Khởi tạo đối tượng User với quyền CUSTOMER và trạng thái ACTIVE.',
        '7. Lưu bản ghi vào MySQL và phát sinh Access Token trả về cho client.'
      ],
      evidence: {
        fileName: 'UserService.java',
        startLine: 42,
        endLine: 46,
        snippet: 'String saltRoundsCost12 = "$2a$12$";\nString hashedPassword = passwordEncoder.encode(rawPassword, saltRoundsCost12);',
        explanation: 'Khởi tạo băm mật khẩu an toàn chuẩn BCrypt với cost factor = 12 trước khi tạo thực thể User và lưu xuống DB.'
      },
      businessRulesRef: ['BR-001', 'BR-002']
    },
    {
      id: 'UC-002',
      name: 'Xác thực & Cấp phát JWT Access Token',
      actor: 'Người dùng đã đăng ký (Registered User)',
      confidence: 'HIGH',
      preCondition: 'Tài khoản tồn tại trong cơ sở dữ liệu và đang ở trạng thái ACTIVE.',
      postCondition: 'Cấp token xác thực Bearer JWT có thời hạn và reset biến failed_attempts về 0.',
      mainFlow: [
        '1. Người dùng gửi POST /api/v1/auth/login kèm username và password.',
        '2. UserService tìm kiếm thông tin tài khoản qua userRepository.findByUsername().',
        '3. Kiểm tra nếu số lần thử sai >= 5 thì chuyển trạng thái sang LOCKED và chặn đăng nhập.',
        '4. Đối chiếu mật khẩu băm qua passwordEncoder.matches().',
        '5. Nếu sai, tăng biến failed_attempts lên 1 và lưu lại DB.',
        '6. Nếu đúng, reset failed_attempts = 0, cập nhật last_login_at và sinh JWT Access Token.'
      ],
      evidence: {
        fileName: 'UserController.java',
        startLine: 28,
        endLine: 35,
        snippet: 'AuthResponse response = userService.registerNewAccount(\n    request.getUsername(),\n    request.getEmail(),\n    request.getRawPassword(),\n    request.getPhoneNumber()\n);',
        explanation: 'Điểm tiếp nhận yêu cầu đăng ký của REST API controller và chuyển tiếp xuống tầng nghiệp vụ.'
      },
      businessRulesRef: ['BR-003']
    },
    {
      id: 'UC-003',
      name: 'Tự động khóa tài khoản khi phát hiện dấu hiệu dò mật khẩu',
      actor: 'Hệ thống phòng thủ (Security Engine)',
      confidence: 'HIGH',
      preCondition: 'Người dùng nhập sai mật khẩu liên tiếp tới ngưỡng 5 lần.',
      postCondition: 'Trạng thái tài khoản đổi thành LOCKED, ngăn chặn đăng nhập cho đến khi quản trị viên mở khóa.',
      mainFlow: [
        '1. Khi người dùng xác thực thất bại, UserService kiểm tra biến failedAttempts.',
        '2. Nếu failedAttempts >= 5, cập nhật status = AccountStatus.LOCKED.',
        '3. Lưu trạng thái mới vào cơ sở dữ liệu qua userRepository.save(user).',
        '4. Ném ngoại lệ AccountLockedException thông báo tài khoản bị khóa.'
      ],
      evidence: {
        fileName: 'UserService.java',
        startLine: 68,
        endLine: 74,
        snippet: 'if (user.getFailedAttempts() >= 5) {\n    user.setStatus(AccountStatus.LOCKED);\n    userRepository.save(user);\n    throw new AccountLockedException("Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần liên tiếp.");\n}',
        explanation: 'Khối điều kiện kiểm tra ngưỡng brute-force 5 lần và chuyển trạng thái user sang LOCKED.'
      },
      businessRulesRef: ['BR-003']
    }
  ],
  businessRules: [
    {
      id: 'BR-001',
      ruleName: 'Mã hóa mật khẩu bắt buộc bằng BCrypt Cost Factor 12',
      description: 'Mật khẩu người dùng không bao giờ được lưu dưới dạng plain-text. Bắt buộc áp dụng thuật toán BCrypt với tiền tố "$2a$12$" để chống lại tấn công Rainbow Table và GPU Cracking.',
      confidence: 'HIGH',
      impactLevel: 'CRITICAL',
      evidence: {
        fileName: 'UserService.java',
        startLine: 42,
        endLine: 46,
        snippet: 'String saltRoundsCost12 = "$2a$12$";\nString hashedPassword = passwordEncoder.encode(rawPassword, saltRoundsCost12);',
        explanation: 'Định nghĩa cost factor = 12 và thực hiện encode trước khi gán vào thuộc tính passwordHash của User.'
      }
    },
    {
      id: 'BR-002',
      ruleName: 'Kiểm tra tính duy nhất tuyệt đối của Địa chỉ Email',
      description: 'Mỗi địa chỉ email chỉ được liên kết với duy nhất 1 tài khoản trong hệ thống. Tầng Service phải chủ động kiểm tra bằng hàm existsByEmail trước khi thực hiện thao tác INSERT.',
      confidence: 'HIGH',
      impactLevel: 'HIGH',
      evidence: {
        fileName: 'UserService.java',
        startLine: 34,
        endLine: 38,
        snippet: 'if (userRepository.existsByEmail(email)) {\n    throw new EmailAlreadyExistsException("Email này đã được sử dụng trong hệ thống: " + email);\n}',
        explanation: 'Validation logic ngăn ngừa trùng lặp email ở mức application layer, đồng bộ với UNIQUE index trong MySQL.'
      }
    },
    {
      id: 'BR-003',
      ruleName: 'Khóa tài khoản tự động sau 5 lần xác thực không thành công',
      description: 'Cơ chế bảo vệ chống dò mật khẩu tự động đếm biến failed_attempts. Sau 5 lần nhập sai, tài khoản bị chuyển sang trạng thái LOCKED.',
      confidence: 'HIGH',
      impactLevel: 'HIGH',
      evidence: {
        fileName: 'UserService.java',
        startLine: 68,
        endLine: 74,
        snippet: 'if (user.getFailedAttempts() >= 5) {\n    user.setStatus(AccountStatus.LOCKED);\n    userRepository.save(user);\n    throw new AccountLockedException(...);\n}',
        explanation: 'Ngưỡng 5 lần thử sai dẫn đến khóa vĩnh viễn cho đến khi admin can thiệp.'
      }
    }
  ],
  apiSpecs: [
    {
      endpoint: '/api/v1/auth/register',
      method: 'POST',
      description: 'Tiếp nhận thông tin người dùng mới, kiểm tra trùng lặp email, băm mật khẩu và tạo tài khoản.',
      confidence: 'HIGH',
      requestPayload: '{\n  "username": "johndoe",\n  "email": "john@enterprise.com",\n  "rawPassword": "SecretPassword@123",\n  "phoneNumber": "+84901234567"\n}',
      responsePayload: '{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "userId": 101,\n  "username": "johndoe"\n}',
      evidence: {
        fileName: 'UserController.java',
        startLine: 28,
        endLine: 35,
        snippet: '@PostMapping("/register")\npublic ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest request)',
        explanation: 'Khai báo REST endpoint với Spring Boot @PostMapping annotation.'
      }
    },
    {
      endpoint: '/api/v1/auth/login',
      method: 'POST',
      description: 'Xác thực tài khoản và mật khẩu, kiểm tra trạng thái khóa và trả về JWT Bearer Token.',
      confidence: 'HIGH',
      requestPayload: '{\n  "username": "johndoe",\n  "password": "SecretPassword@123"\n}',
      responsePayload: '{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "userId": 101,\n  "username": "johndoe"\n}',
      evidence: {
        fileName: 'UserController.java',
        startLine: 42,
        endLine: 49,
        snippet: '@PostMapping("/login")\npublic ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest request)',
        explanation: 'Khai báo REST endpoint xử lý yêu cầu đăng nhập và phân phối token.'
      }
    },
    {
      endpoint: '/api/v1/auth/me',
      method: 'GET',
      description: 'Lấy thông tin hồ sơ của người dùng hiện tại dựa trên JWT Token được truyền trong Authorization Header.',
      confidence: 'MEDIUM',
      responsePayload: '{\n  "id": 101,\n  "username": "johndoe",\n  "email": "john@enterprise.com",\n  "role": "CUSTOMER",\n  "status": "ACTIVE"\n}',
      evidence: {
        fileName: 'UserController.java',
        startLine: 51,
        endLine: 54,
        snippet: '@GetMapping("/me")\npublic ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String token)',
        explanation: 'Endpoint truy vấn thông tin cá nhân dựa trên token Bearer.'
      }
    }
  ],
  databaseArchitecture: {
    mermaidErdCode: `erDiagram
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS ||--o{ AUDIT_LOGS : "generates"
    USERS {
        bigint id PK
        varchar_64 username UK
        varchar_128 email UK
        varchar_255 password_hash
        varchar_20 phone_number
        enum role "ADMIN, OPERATOR, CUSTOMER"
        enum status "ACTIVE, LOCKED, SUSPENDED"
        int failed_attempts
        datetime last_login_at
        datetime created_at
    }
    REFRESH_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar_512 token UK
        datetime expiry_date
        boolean is_revoked
    }
    ROLES_PERMISSIONS {
        bigint id PK
        varchar_32 role_name
        varchar_64 permission_key
        varchar_255 description
    }
    AUDIT_LOGS {
        bigint id PK
        bigint user_id FK
        varchar_64 action
        varchar_45 ip_address
        text user_agent
        datetime created_at
    }`,
    tablesDescription: 'Cơ sở dữ liệu gồm 4 bảng chính tuân thủ chuẩn 3NF: users (lưu trữ danh tính và trạng thái bảo vệ brute-force), refresh_tokens (quản lý vòng đời phiên xác thực có cascade delete), roles_permissions (cấu hình quyền RBAC), và audit_logs (lưu vết thao tác bảo mật).',
    entitiesCount: 4
  },
  diagramFlows: [
    {
      title: 'Luồng Đăng ký & Băm mật khẩu (Registration Flow)',
      description: 'Mô tả tuần tự các bước từ khi Client gửi thông tin đăng ký đến khi lưu trữ mật khẩu BCrypt và phát hành JWT token.',
      mermaidSequenceCode: `sequenceDiagram
    autonumber
    actor Client as Khách Hàng (Browser)
    participant Ctrl as UserController
    participant Svc as UserService
    participant Repo as UserRepository
    participant DB as MySQL Database

    Client->>Ctrl: POST /api/v1/auth/register (JSON)
    Ctrl->>Svc: registerNewAccount(username, email, password)
    Svc->>Repo: existsByEmail(email)
    Repo->>DB: SELECT COUNT(*) WHERE email = ?
    DB-->>Repo: 0 (Chưa tồn tại)
    Repo-->>Svc: false
    Note over Svc: Băm mật khẩu bằng BCrypt (Cost=12)
    Svc->>Repo: save(newUser with ACTIVE & CUSTOMER)
    Repo->>DB: INSERT INTO users VALUES (...)
    DB-->>Repo: ID: 101, Status: ACTIVE
    Repo-->>Svc: Saved User Entity
    Note over Svc: Sinh JWT Access Token
    Svc-->>Ctrl: AuthResponse(token, 101, "johndoe")
    Ctrl-->>Client: 200 OK + JWT Bearer Token`
    },
    {
      title: 'Luồng Đăng nhập & Cơ chế Phòng thủ Brute-force',
      description: 'Mô tả tuần tự quy trình kiểm tra mật khẩu, cập nhật biến failed_attempts và tự động khóa tài khoản khi vượt quá 5 lần.',
      mermaidSequenceCode: `sequenceDiagram
    autonumber
    actor Client as Khách Hàng (Browser)
    participant Ctrl as UserController
    participant Svc as UserService
    participant Repo as UserRepository
    participant DB as MySQL Database

    Client->>Ctrl: POST /api/v1/auth/login
    Ctrl->>Svc: authenticateUser(username, password)
    Svc->>Repo: findByUsername(username)
    Repo->>DB: SELECT * FROM users WHERE username = ?
    DB-->>Repo: User Record (failed_attempts=4)
    Repo-->>Svc: User Entity
    alt failed_attempts >= 5
        Note over Svc: Tự động đổi status = LOCKED
        Svc->>Repo: save(status=LOCKED)
        Svc-->>Ctrl: Throw AccountLockedException
        Ctrl-->>Client: 403 Forbidden: Tài khoản bị khóa
    else Mật khẩu không trùng khớp
        Note over Svc: failed_attempts = failed_attempts + 1
        Svc->>Repo: save(failed_attempts=5)
        Svc-->>Ctrl: Throw InvalidCredentialsException
        Ctrl-->>Client: 401 Unauthorized: Mật khẩu sai
    else Mật khẩu chính xác
        Note over Svc: Reset failed_attempts = 0 & update last_login
        Svc->>Repo: save(user)
        Svc-->>Ctrl: AuthResponse(JWT Token)
        Ctrl-->>Client: 200 OK (Đăng nhập thành công)
    end`
    }
  ]
};
