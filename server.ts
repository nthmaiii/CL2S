import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Helper to initialize Gemini Client
  const getGeminiClient = (customKey?: string) => {
    const key = customKey?.trim() || process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Helper with model fallback & timeout for maximum responsiveness
  const generateWithFallback = async (
    ai: GoogleGenAI,
    contents: any,
    config?: any
  ) => {
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`Calling Gemini model: ${model}...`);
        const responsePromise = ai.models.generateContent({
          model,
          contents,
          config,
        });

        // 12-second timeout per candidate
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout model ${model}`)), 12000)
        );

        const response: any = await Promise.race([responsePromise, timeoutPromise]);
        if (response && response.text) {
          return { response, modelUsed: model };
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Không thể tạo phản hồi từ mô hình Gemini.');
  };

  // API 1: Health & Gemini Status Check
  app.get('/api/gemini/status', async (req, res) => {
    const hasServerKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
    res.json({
      status: 'ok',
      hasServerKey,
      activeModel: 'gemini-2.5-flash',
      serverTime: new Date().toISOString(),
    });
  });

  // API 2: Test Gemini Live Connection with real ping & generation
  app.post('/api/gemini/test', async (req, res) => {
    try {
      const customKey = req.body?.apiKey;
      const ai = getGeminiClient(customKey);

      if (!ai) {
        return res.status(400).json({
          success: false,
          error: 'Chưa phát hiện GEMINI_API_KEY trên môi trường server hoặc khóa truyền vào.',
        });
      }

      const startTime = Date.now();
      const { response, modelUsed } = await generateWithFallback(
        ai,
        'Xin chào! Hãy phản hồi đúng 1 câu ngắn xác nhận kết nối Google Gemini API hoạt động hoàn hảo và sẵn sàng phục vụ nền tảng CodeLegacy2Spec (CL2S).'
      );
      const latencyMs = Date.now() - startTime;

      res.json({
        success: true,
        text: response.text?.trim() || 'Kết nối Gemini API thành công!',
        latencyMs,
        model: modelUsed,
        source: customKey ? 'BYOK (User Key)' : 'Server Environment Key (process.env.GEMINI_API_KEY)',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Gemini Test Connection Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Lỗi khi kiểm tra kết nối Gemini API.',
      });
    }
  });

  // API 3: Codebase Q&A Chatbot / Analysis with Gemini
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { query, customApiKey, codeContext } = req.body;
      const ai = getGeminiClient(customApiKey);

      if (!ai) {
        return res.status(400).json({
          success: false,
          error: 'Không tìm thấy API Key hợp lệ. Vui lòng cấu hình GEMINI_API_KEY hoặc bật Demo Mode.',
        });
      }

      const systemInstruction = `Bạn là Trợ lý AI cao cấp chuyên gia dịch ngược và phân tích mã nguồn di sản (CL2S - CodeLegacy2Spec) phục vụ giải đấu AI Riser Vietnam 2026.
Nhiệm vụ của bạn:
1. Khi người dùng chào hỏi (ví dụ "chào", "hello", "xin chào"): Hãy chào lại niềm nở, tự giới thiệu ngắn gọn và nêu các khả năng hỗ trợ tra cứu codebase của bạn.
2. Khi người dùng yêu cầu "mô tả dự án" hoặc "tổng quan dự án": Hãy tóm tắt rõ ràng mục đích của dự án, các tệp/module chính, kiến trúc phân tầng (Controller, Service, Repository, Database), các API chính và các công nghệ sử dụng dựa trên [NGỮ CẢNH MÃ NGUỒN DỰ ÁN].
3. Khi hỏi về thuật toán/bảo mật: Giải thích cặn kẽ logic nghiệp vụ (BCrypt salt cost 12, JWT token, brute force lock sau 5 lần sai, validation...).
4. Trích dẫn chính xác tên tệp tin (ví dụ \`UserService.java\`, \`UserController.java\`, \`schema.sql\`, \`index.html\`) và số dòng tham chiếu nếu có trong ngữ cảnh.
5. Luôn phản hồi bằng tiếng Việt tự nhiên, chuẩn kỹ thuật phần mềm, cấu trúc Markdown rõ ràng (tiêu đề, danh sách bullet).`;

      const prompt = `[NGỮ CẢNH MÃ NGUỒN DỰ ÁN]:
${codeContext || `
1. UserController.java: Chứa các REST API /api/v1/auth/register, /api/v1/auth/login, /api/v1/auth/me
2. UserService.java: Chứa hàm registerNewAccount (dòng 28-48), authenticateUser với BCrypt cost 12 (dòng 42-46) và brute-force lock sau 5 lần failedAttempts (dòng 68-74)
3. UserRepository.java: Spring Data JPA Repository với findByUsername, existsByEmail
4. schema.sql: Cấu trúc 4 bảng users, refresh_tokens, roles_permissions, audit_logs
`}

[YÊU CẦU CỦA NGƯỜI DÙNG]:
"${query}"

Hãy trả lời chính xác, đúng trọng tâm yêu cầu:`;

      const { response, modelUsed } = await generateWithFallback(
        ai,
        prompt,
        { systemInstruction }
      );

      res.json({
        success: true,
        text: response.text,
        model: modelUsed,
      });
    } catch (error: any) {
      console.error('Gemini Chat API Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Lỗi trong quá trình xử lý yêu cầu Gemini AI.',
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CL2S Fullstack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
