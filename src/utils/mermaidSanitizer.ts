/**
 * Robust MermaidJS sanitizer and rendering utility.
 * Prevents client crashes and layout distortions when rendering diagrams.
 */

declare global {
  interface Window {
    mermaid?: any;
  }
}

/**
 * Remove any rogue error elements that MermaidJS might inject directly into document.body
 */
export function removeMermaidErrorDomElements() {
  if (typeof document === 'undefined') return;
  try {
    const errorElements = document.querySelectorAll('[id^="dmermaid"], [id^="mermaid-error"], .error-icon, .mermaid-error');
    errorElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  } catch (e) {
    // Ignore DOM cleanup errors
  }
}

/**
 * Strips unsupported characters, fixes common syntax issues in AI-generated Mermaid code
 */
export function sanitizeMermaidCode(rawCode: string): string {
  if (!rawCode) return '';

  let sanitized = rawCode.trim();

  // Strip markdown code fences if present
  sanitized = sanitized.replace(/^```mermaid\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();

  // If it's an erDiagram
  if (sanitized.startsWith('erDiagram')) {
    sanitized = sanitized.split('\n').map(line => {
      let trimmed = line.trim();
      // Replace complex type strings like varchar(64) with varchar_64
      trimmed = trimmed.replace(/\(([0-9]+)\)/g, '_$1');
      return trimmed;
    }).join('\n');
  }

  // If it's a sequenceDiagram
  if (sanitized.startsWith('sequenceDiagram')) {
    sanitized = sanitized.split('\n').map(line => {
      return line;
    }).join('\n');
  }

  return sanitized;
}

/**
 * Clean and normalize rendered SVG to prevent container overflow, distortion, or unwanted zoom.
 */
function cleanSvgOutput(rawSvg: string): string {
  if (!rawSvg || !rawSvg.includes('<svg')) return rawSvg;

  let cleaned = rawSvg;

  // Remove fixed inline max-width or width styles that conflict with responsive CSS
  cleaned = cleaned.replace(/style="([^"]*max-width:[^;"]*;?)([^"]*)"/gi, (match, p1, p2) => {
    return `style="${p2}"`;
  });

  // Ensure svg has proper classes and responsive attributes
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    return `<svg ${attrs} class="mermaid-svg-rendered" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
  });

  return cleaned;
}

export async function renderMermaidSvg(id: string, code: string): Promise<string> {
  removeMermaidErrorDomElements();
  const cleanCode = sanitizeMermaidCode(code);
  if (!cleanCode) {
    return `<div class="p-6 text-center text-slate-400 text-xs font-mono">Không có dữ liệu sơ đồ Mermaid để hiển thị.</div>`;
  }

  if (typeof window !== 'undefined' && window.mermaid) {
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#0891b2',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#06b6d4',
          lineColor: '#38bdf8',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          noteBkgColor: '#164e63',
          noteTextColor: '#ecfeff',
          noteBorderColor: '#0891b2',
          actorBkg: '#0e7490',
          actorBorder: '#38bdf8',
          actorTextColor: '#ffffff',
          actorLineColor: '#38bdf8',
          signalColor: '#38bdf8',
          signalTextColor: '#f8fafc',
          labelBoxBkgColor: '#0f172a',
          labelBoxBorderColor: '#0891b2',
          labelTextColor: '#f8fafc',
          loopTextColor: '#f8fafc',
          activationBorderColor: '#06b6d4',
          activationBkgColor: '#164e63',
          sequenceNumberColor: '#0891b2',
        },
        securityLevel: 'loose',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      });

      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueId = `mermaid-render-${safeId}-${Math.random().toString(36).substring(2, 9)}`;
      const { svg } = await window.mermaid.render(uniqueId, cleanCode);
      removeMermaidErrorDomElements();
      return cleanSvgOutput(svg);
    } catch (err: any) {
      removeMermaidErrorDomElements();
      console.warn('Mermaid rendering warning, attempting fallback format:', err);
      try {
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueIdFallback = `mermaid-fallback-${safeId}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await window.mermaid.render(uniqueIdFallback, cleanCode.replace(/ UK| UK/g, ''));
        removeMermaidErrorDomElements();
        return cleanSvgOutput(svg);
      } catch (fallbackErr: any) {
        removeMermaidErrorDomElements();
        console.error('Mermaid render failed completely:', fallbackErr);
        return `<div class="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs">
          <div class="flex items-center gap-2 text-cyan-400 font-bold mb-2">
            <span>Mã định nghĩa sơ đồ (Mermaid Code):</span>
          </div>
          <pre class="font-mono text-xs text-cyan-300 p-3 bg-slate-950 rounded-lg overflow-x-auto border border-slate-800">${cleanCode}</pre>
        </div>`;
      }
    }
  }

  return `<div class="p-4 bg-slate-900 rounded text-cyan-300 font-mono text-xs">${cleanCode}</div>`;
}
