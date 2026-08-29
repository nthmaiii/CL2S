import { CodeFile } from '../types';

export const SAMPLE_CODEBASE: CodeFile[] = [
  {
    name: 'UserController.java',
    path: 'src/main/java/com/legacy/auth/controller/UserController.java',
    language: 'java',
    size: '3.4 KB',
    linesCount: 52,
    category: 'controller',
    content: `package com.legacy.auth.controller;

import com.legacy.auth.dto.RegisterRequest;
import com.legacy.auth.dto.LoginRequest;
import com.legacy.auth.dto.AuthResponse;
import com.legacy.auth.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

/**
 * Legacy User Controller (Reconstructed by CL2S)
 * Handles client authentication and profile requests.
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Endpoint đăng ký tài khoản người dùng mới
     * Endpoint: POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        // [CL2S TRACE-POINT: UC-001]
        AuthResponse response = userService.registerNewAccount(
            request.getUsername(),
            request.getEmail(),
            request.getRawPassword(),
            request.getPhoneNumber()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint xác thực người dùng & cấp phát JWT token
     * Endpoint: POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.authenticateUser(
            request.getUsername(),
            request.getPassword()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(userService.getUserProfileFromToken(token));
    }
}`
  },
  {
    name: 'UserService.java',
    path: 'src/main/java/com/legacy/auth/service/UserService.java',
    language: 'java',
    size: '5.8 KB',
    linesCount: 88,
    category: 'service',
    content: `package com.legacy.auth.service;

import com.legacy.auth.model.User;
import com.legacy.auth.model.UserRole;
import com.legacy.auth.model.AccountStatus;
import com.legacy.auth.repository.UserRepository;
import com.legacy.auth.security.BCryptPasswordEncoder;
import com.legacy.auth.security.JwtTokenProvider;
import com.legacy.auth.exception.EmailAlreadyExistsException;
import com.legacy.auth.exception.InvalidCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public UserService(UserRepository userRepository, 
                       BCryptPasswordEncoder passwordEncoder, 
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Đăng ký tài khoản mới kèm logic băm mật khẩu và kiểm tra trùng lặp
     */
    @Transactional
    public AuthResponse registerNewAccount(String username, String email, String rawPassword, String phone) {
        // [CL2S TRACE-POINT: BR-002 - Kiểm tra Email duy nhất]
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email này đã được sử dụng trong hệ thống: " + email);
        }

        // [CL2S TRACE-POINT: BR-001 & UC-001 - Băm mật khẩu bằng BCrypt cost factor 12]
        String saltRoundsCost12 = "$2a$12$";
        String hashedPassword = passwordEncoder.encode(rawPassword, saltRoundsCost12);
        
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setPasswordHash(hashedPassword);
        newUser.setPhoneNumber(phone);
        newUser.setRole(UserRole.CUSTOMER);
        newUser.setStatus(AccountStatus.ACTIVE);
        newUser.setFailedAttempts(0);
        newUser.setCreatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(newUser);
        String token = tokenProvider.generateAccessToken(savedUser);
        return new AuthResponse(token, savedUser.getId(), savedUser.getUsername());
    }

    /**
     * Xác thực thông tin đăng nhập và cơ chế tự khóa sau 5 lần sai
     */
    @Transactional
    public AuthResponse authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new InvalidCredentialsException("Tài khoản hoặc mật khẩu không chính xác"));

        // [CL2S TRACE-POINT: BR-003 - Tự động khóa tài khoản nếu nhập sai > 5 lần]
        if (user.getFailedAttempts() >= 5) {
            user.setStatus(AccountStatus.LOCKED);
            userRepository.save(user);
            throw new AccountLockedException("Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần liên tiếp.");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            userRepository.save(user);
            throw new InvalidCredentialsException("Mật khẩu không trùng khớp.");
        }

        user.setFailedAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = tokenProvider.generateAccessToken(user);
        return new AuthResponse(token, user.getId(), user.getUsername());
    }
}`
  },
  {
    name: 'UserRepository.java',
    path: 'src/main/java/com/legacy/auth/repository/UserRepository.java',
    language: 'java',
    size: '2.1 KB',
    linesCount: 38,
    category: 'repository',
    content: `package com.legacy.auth.repository;

import com.legacy.auth.model.User;
import com.legacy.auth.model.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * Giao diện truy xuất cơ sở dữ liệu cho thực thể Người dùng
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.status = :status AND u.createdAt < :cutoffDate")
    List<User> findInactiveUsersBefore(@Param("status") AccountStatus status, @Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'CUSTOMER'")
    long countTotalCustomers();
}`
  },
  {
    name: 'schema.sql',
    path: 'src/main/resources/db/migration/V1__init_schema.sql',
    language: 'sql',
    size: '4.1 KB',
    linesCount: 65,
    category: 'schema',
    content: `-- ==========================================================
-- BẢNG DỮ LIỆU HỆ THỐNG XÁC THỰC VÀ PHÂN QUYỀN (CL2S RECONSTRUCTED)
-- ==========================================================

CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`username\` VARCHAR(64) NOT NULL UNIQUE,
    \`email\` VARCHAR(128) NOT NULL UNIQUE,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`phone_number\` VARCHAR(20) NULL,
    \`role\` ENUM('ADMIN', 'OPERATOR', 'CUSTOMER') DEFAULT 'CUSTOMER',
    \`status\` ENUM('ACTIVE', 'LOCKED', 'SUSPENDED') DEFAULT 'ACTIVE',
    \`failed_attempts\` INT DEFAULT 0,
    \`last_login_at\` DATETIME NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_users_email\` (\`email\`),
    INDEX \`idx_users_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`roles_permissions\` (
    \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`role_name\` VARCHAR(32) NOT NULL,
    \`permission_key\` VARCHAR(64) NOT NULL,
    \`description\` VARCHAR(255) NULL,
    UNIQUE KEY \`uk_role_permission\` (\`role_name\`, \`permission_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`refresh_tokens\` (
    \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` BIGINT NOT NULL,
    \`token\` VARCHAR(512) NOT NULL UNIQUE,
    \`expiry_date\` DATETIME NOT NULL,
    \`is_revoked\` BOOLEAN DEFAULT FALSE,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \`fk_tokens_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`audit_logs\` (
    \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` BIGINT NULL,
    \`action\` VARCHAR(64) NOT NULL,
    \`ip_address\` VARCHAR(45) NULL,
    \`user_agent\` TEXT NULL,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX \`idx_audit_user\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  }
];

export const EXCLUDED_FILES_LOG = [
  { name: '.env', path: '.env', reason: 'Chứa Secret API Keys & Password kết nối DB nhạy cảm' },
  { name: 'private_key.pem', path: 'src/main/resources/certs/private_key.pem', reason: 'Chứng chỉ khóa mã hóa RSA private key' },
  { name: 'credentials.json', path: 'config/credentials.json', reason: 'Tài khoản dịch vụ Cloud Service Account' },
  { name: 'node_modules/*', path: 'node_modules/ (12,410 files)', reason: 'Thư viện phụ thuộc bên ngoài - tự động loại bỏ để tối ưu token context' },
  { name: '.git/*', path: '.git/ (280 objects)', reason: 'Siêu dữ liệu commit - không liên quan đến business logic' }
];

export const APPCHAT_CMS_CODEBASE: CodeFile[] = [
  {
    name: 'server.js',
    path: 'src/server.js',
    language: 'javascript',
    size: '3.8 KB',
    linesCount: 65,
    category: 'controller',
    content: `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chatRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const { initSocketHandlers } = require('./controllers/chatController');
const { verifyJwtToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());

// Gắn các định tuyến API RESTful
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/cms', cmsRoutes);

// Khởi tạo Socket.IO Realtime Gateway cho Chat
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const user = verifyJwtToken(token);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(\`[Socket] User \${socket.user.username} connected: \${socket.id}\`);
  initSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(\`AppChat-CMS running on port \${PORT}\`);
});`
  },
  {
    name: 'chatController.js',
    path: 'src/controllers/chatController.js',
    language: 'javascript',
    size: '4.9 KB',
    linesCount: 82,
    category: 'service',
    content: `const db = require('../db');

/**
 * Xử lý các sự kiện thời gian thực (Realtime WebSockets)
 */
function initSocketHandlers(io, socket) {
  // [CL2S TRACE-POINT: UC-01 Realtime Messaging]
  socket.on('join_room', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    io.to(roomId).emit('user_joined', {
      userId: socket.user.id,
      username: socket.user.username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send_message', async (data) => {
    const { roomId, content, attachmentUrl } = data;
    
    // Kiểm tra ràng buộc và làm sạch nội dung tin nhắn
    if (!content || content.trim().length === 0) {
      return socket.emit('error', { message: 'Nội dung tin nhắn không được rỗng!' });
    }
    if (content.length > 2000) {
      return socket.emit('error', { message: 'Tin nhắn vượt quá giới hạn 2000 ký tự!' });
    }

    try {
      // Lưu tin nhắn vào CSDL
      const result = await db.query(
        'INSERT INTO chat_messages (room_id, sender_id, content, attachment_url, sent_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [roomId, socket.user.id, content, attachmentUrl || null]
      );
      const savedMsg = result.rows[0];

      // Phát sóng tức thời tới tất cả client trong room
      io.to(roomId).emit('new_message', savedMsg);
    } catch (err) {
      console.error('Lỗi khi lưu tin nhắn:', err);
      socket.emit('error', { message: 'Không thể gửi tin nhắn' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', { username: socket.user.username });
  });
}

module.exports = { initSocketHandlers };`
  },
  {
    name: 'cmsController.js',
    path: 'src/controllers/cmsController.js',
    language: 'javascript',
    size: '5.2 KB',
    linesCount: 88,
    category: 'controller',
    content: `const db = require('../db');

/**
 * Quản trị bài viết và chuyên mục CMS
 */
async function getCmsPosts(req, res) {
  const { status, categoryId, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const posts = await db.query(
      'SELECT p.*, c.name as category_name, u.username as author_name FROM cms_posts p LEFT JOIN cms_categories c ON p.category_id = c.id LEFT JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ success: true, data: posts.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function createCmsPost(req, res) {
  // [CL2S TRACE-POINT: UC-02 CMS Content Management]
  const { title, slug, content, categoryId, status = 'DRAFT' } = req.body;
  
  // Kiểm tra quyền Quản trị viên (RBAC)
  if (req.user.role !== 'ADMIN' && req.user.role !== 'EDITOR') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền đăng bài CMS!' });
  }

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc!' });
  }

  try {
    const result = await db.query(
      'INSERT INTO cms_posts (title, slug, content, category_id, author_id, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [title, slug || title.toLowerCase().replace(/\\s+/g, '-'), content, categoryId, req.user.id, status]
    );
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getCmsPosts, createCmsPost };`
  },
  {
    name: 'schema.sql',
    path: 'src/db/schema.sql',
    language: 'sql',
    size: '4.6 KB',
    linesCount: 78,
    category: 'schema',
    content: `-- CƠ SỞ DỮ LIỆU APPCHAT-CMS (CHATTING & CONTENT MANAGEMENT SYSTEM)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'USER', -- 'ADMIN', 'EDITOR', 'USER'
    status VARCHAR(32) DEFAULT 'ACTIVE', -- 'ACTIVE', 'BANNED'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_rooms (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) DEFAULT 'GROUP', -- 'DIRECT', 'GROUP'
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id),
    content TEXT NOT NULL,
    attachment_url TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    slug VARCHAR(128) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS cms_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category_id INT REFERENCES cms_categories(id) ON DELETE SET NULL,
    author_id INT REFERENCES users(id),
    status VARCHAR(32) DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  }
];
