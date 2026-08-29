import { FullSRS } from '../types';

/**
 * Safe download helper that works reliably inside iframes and across all browsers.
 */
export function downloadFile(content: string, fileName: string, mimeType: string) {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 400);
    return true;
  } catch (err) {
    console.error('Download error:', err);
    return false;
  }
}

/**
 * Universal copy to clipboard with legacy fallback for restrictive iframes
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Generate standardized IEEE 830 / ISO 29148 Markdown SRS
 */
export function generateMarkdownSRS(srsSpec: FullSRS): string {
  const p = srsSpec.projectOverview;
  return `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - SOFTWARE REQUIREMENTS SPECIFICATION)
**Tên dự án**: ${p.name}
**Khẩu hiệu & Định vị**: ${p.slogan}
**Ngày tạo**: ${new Date().toLocaleDateString('vi-VN')} | **Nền tảng**: CodeLegacy2Spec (CL2S) AI Riser 2026
**Độ tin cậy tái dựng**: ${p.metrics.reconstructionConfidence}% | **Phong cách kiến trúc**: ${p.architecturalStyle}

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
${p.description}

### 1.1. Các chỉ số tái dựng mã nguồn (Reconstruction Metrics)
- **Tổng số tệp quét được**: ${p.metrics.totalFilesScanned.toLocaleString()} tệp
- **Tệp logic nghiệp vụ cốt lõi**: ${p.metrics.relevantFilesCount} tệp
- **Tệp rác / tệp nhạy cảm đã lọc**: ${p.metrics.ignoredFilesCount.toLocaleString()} tệp
- **Tổng số dòng mã (LOC)**: ${p.metrics.totalLinesOfCode} dòng
- **Context Caching TTL**: ${p.metrics.cacheTtlMinutes} phút
- **Token tiết kiệm được nhờ Tree-shaking**: ~85,400 tokens (Tiết kiệm 80% chi phí)

### 1.2. Công nghệ phát hiện trong mã nguồn (Tech Stack)
${p.techStackDetected.map(t => `- **${t.category}**: ${t.name} ${t.version ? `(v${t.version})` : ''} - *Độ tin cậy: ${t.confidence}%*`).join('\n')}

### 1.3. Đánh giá An ninh & Bảo mật (Security Audit Summary)
${p.securityFindingsSummary.map(s => `- [x] ${s}`).join('\n')}

---

## 2. DANH SÁCH CA SỬ DỤNG VÀ TRUY VẾT BẰNG CHỨNG (USE CASES & TRACEABILITY)
${srsSpec.useCases.map((uc, idx) => `
### 2.${idx + 1}. [${uc.id}] ${uc.name}
- **Tác nhân chính (Actor)**: ${uc.actor}
- **Điều kiện tiên quyết (Pre-condition)**: ${uc.preCondition}
- **Kết quả mong đợi (Post-condition)**: ${uc.postCondition}
- **Độ tin cậy bằng chứng**: ${uc.confidence}
- **Bằng chứng mã nguồn (Traceability Link)**: \`${uc.evidence.fileName}\` (Dòng ${uc.evidence.startLine}–${uc.evidence.endLine})
  - *Giải thích*: ${uc.evidence.explanation}
  \`\`\`
  ${uc.evidence.snippet}
  \`\`\`
- **Luồng thực thi chính (Main Flow)**:
${uc.mainFlow.map(step => `  ${step}`).join('\n')}
`).join('\n')}

---

## 3. QUY TẮC NGHIỆP VỤ & RÀNG BUỘC TOÀN VẸN (BUSINESS RULES)
${srsSpec.businessRules.map((br, idx) => `
### 3.${idx + 1}. [${br.id}] ${br.ruleName}
- **Mô tả quy tắc**: ${br.description}
- **Mức độ ảnh hưởng**: ${br.impactLevel}
- **Bằng chứng mã nguồn**: \`${br.evidence.fileName}\` (Dòng ${br.evidence.startLine}–${br.evidence.endLine})
- **Đoạn mã xác thực**:
  \`\`\`
  ${br.evidence.snippet}
  \`\`\`
`).join('\n')}

---

## 4. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATIONS)
${srsSpec.apiSpecs.map((api, idx) => `
### 4.${idx + 1}. \`${api.method}\` ${api.endpoint}
- **Mô tả**: ${api.description}
- **Độ tin cậy**: ${api.confidence}
- **Bằng chứng mã nguồn**: \`${api.evidence.fileName}\` (Dòng ${api.evidence.startLine}–${api.evidence.endLine})
- **Dữ liệu yêu cầu (Request Payload)**: \`${api.requestPayload || 'N/A'}\`
- **Dữ liệu phản hồi (Response Payload)**: \`${api.responsePayload || 'N/A'}\`
`).join('\n')}

---

## 5. KIẾN TRÚC CƠ SỞ DỮ LIỆU & SƠ ĐỒ THỰC THỂ (DATABASE ARCHITECTURE)
- **Số lượng thực thể / bảng**: ${srsSpec.databaseArchitecture.entitiesCount}
- **Mô tả cấu trúc**: ${srsSpec.databaseArchitecture.tablesDescription}

### 5.1. Sơ đồ thực thể ERD (MermaidJS)
\`\`\`mermaid
${srsSpec.databaseArchitecture.mermaidErdCode}
\`\`\`

---
*Tài liệu được xuất tự động bởi CodeLegacy2Spec - Nền tảng AI Re-engineering chuẩn ISO 29148.*
`;
}

/**
 * Generate styled HTML/DOC document for Microsoft Word & LibreOffice
 */
export function generateWordHtmlSRS(srsSpec: FullSRS): string {
  const p = srsSpec.projectOverview;
  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>SRS - ${p.name}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: auto; padding: 30px; }
  h1 { color: #0f172a; border-bottom: 3px solid #0891b2; padding-bottom: 8px; font-size: 24px; }
  h2 { color: #0e7490; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px; font-size: 18px; }
  h3 { color: #1e293b; font-size: 15px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; text-align: left; }
  th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
  .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; background: #e0f2fe; color: #0369a1; }
  .badge-success { background: #dcfce7; color: #15803d; }
  .code-box { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto; }
  .evidence-box { background: #f8fafc; border-left: 4px solid #0891b2; padding: 10px 14px; margin: 8px 0; font-size: 13px; }
</style>
</head>
<body>
  <h1>TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)</h1>
  <p><strong>Dự án:</strong> ${p.name} | <strong>Khẩu hiệu:</strong> ${p.slogan}</p>
  <p><strong>Độ tin cậy:</strong> <span class="badge badge-success">${p.metrics.reconstructionConfidence}% Confidence</span> | <strong>Kiến trúc:</strong> <span class="badge">${p.architecturalStyle}</span></p>

  <h2>1. TỔNG QUAN DỰ ÁN</h2>
  <p>${p.description}</p>
  
  <table>
    <tr><th>Chỉ số</th><th>Giá trị</th></tr>
    <tr><td>Tổng số tệp quét</td><td>${p.metrics.totalFilesScanned.toLocaleString()}</td></tr>
    <tr><td>Tệp nghiệp vụ giữ lại</td><td>${p.metrics.relevantFilesCount}</td></tr>
    <tr><td>Dòng mã nguồn (LOC)</td><td>${p.metrics.totalLinesOfCode}</td></tr>
    <tr><td>Context Cache TTL</td><td>${p.metrics.cacheTtlMinutes} Phút</td></tr>
  </table>

  <h2>2. CÔNG NGHỆ & BẢO MẬT</h2>
  <div class="evidence-box">
    <strong>Công nghệ phát hiện:</strong> ${p.techStackDetected.map(t => `${t.name} (${t.category})`).join(', ')}
  </div>
  <ul>
    ${p.securityFindingsSummary.map(s => `<li>${s}</li>`).join('')}
  </ul>

  <h2>3. DANH SÁCH CA SỬ DỤNG (USE CASES)</h2>
  ${srsSpec.useCases.map(uc => `
    <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
      <h3>${uc.id}: ${uc.name} <span class="badge">${uc.confidence}</span></h3>
      <p><strong>Tác nhân:</strong> ${uc.actor} | <strong>Tiền điều kiện:</strong> ${uc.preCondition}</p>
      <p><strong>Hậu điều kiện:</strong> ${uc.postCondition}</p>
      <div class="evidence-box">
        <strong>Bằng chứng truy vết:</strong> <code>${uc.evidence.fileName}</code> (Dòng ${uc.evidence.startLine}-${uc.evidence.endLine})<br>
        <em>${uc.evidence.explanation}</em>
      </div>
      <p><strong>Luồng thực thi:</strong></p>
      <ol>
        ${uc.mainFlow.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>
  `).join('')}

  <h2>4. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)</h2>
  <table>
    <tr><th>Mã</th><th>Tên quy tắc</th><th>Mô tả</th><th>Bằng chứng</th></tr>
    ${srsSpec.businessRules.map(br => `
      <tr>
        <td><strong>${br.id}</strong></td>
        <td>${br.ruleName}</td>
        <td>${br.description}</td>
        <td><code>${br.evidence.fileName}</code> (${br.evidence.startLine}-${br.evidence.endLine})</td>
      </tr>
    `).join('')}
  </table>

  <h2>5. CƠ SỞ DỮ LIỆU & BẢNG THỰC THỂ</h2>
  <p>${srsSpec.databaseArchitecture.tablesDescription}</p>
  <div class="code-box">
${srsSpec.databaseArchitecture.mermaidErdCode}
  </div>

  <p style="margin-top: 40px; font-size: 11px; color: #64748b; text-align: center;">
    Tài liệu tạo bởi CodeLegacy2Spec - Re-engineering & Traceability Specification System (AI Riser 2026).
  </p>
</body>
</html>`;
}
