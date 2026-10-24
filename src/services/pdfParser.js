// ============================================================================
// PDF TEXT EXTRACTION SERVICE
// Lightweight browser PDF text parser with multi-tier extraction:
// 1. PDF.js (CDN dynamically loaded on demand)
// 2. Native PDF stream text extractor fallback
// ============================================================================

let pdfjsLoadingPromise = null;

function loadPdfJsScript() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise;

  pdfjsLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-pdfjs="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.pdfjsLib || null));
      existing.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.setAttribute('data-pdfjs', 'true');
    script.async = true;
    script.onload = () => {
      try {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      } catch {
        // ignore worker configuration issues
      }
      resolve(window.pdfjsLib || null);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
}

/**
 * Extracts plain text from a PDF File or ArrayBuffer using PDF.js or native fallback.
 */
export async function extractTextFromPdf(fileOrBuffer) {
  if (!fileOrBuffer) return '';

  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || (typeof File !== 'undefined' && fileOrBuffer instanceof File)) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    return '';
  }

  // Tier 1: Try PDF.js
  try {
    const pdfjs = await loadPdfJsScript();
    if (pdfjs && typeof pdfjs.getDocument === 'function') {
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const doc = await loadingTask.promise;
      const textChunks = [];

      for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 15); pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        if (pageText.trim()) {
          textChunks.push(pageText.trim());
        }
      }

      const fullText = textChunks.join('\n\n');
      if (fullText.trim().length > 30) {
        return cleanExtractedText(fullText);
      }
    }
  } catch (err) {
    console.warn('[PDF Parser] PDF.js extraction notice:', err.message);
  }

  // Tier 2: Native stream parsing fallback
  try {
    const nativeText = await extractTextFromPdfBinary(arrayBuffer);
    if (nativeText.trim().length > 20) {
      return cleanExtractedText(nativeText);
    }
  } catch (err) {
    console.warn('[PDF Parser] Native stream extraction notice:', err.message);
  }

  return 'PDF document uploaded (binary contents ready for processing).';
}

/**
 * Native binary fallback text extraction from PDF streams.
 */
async function extractTextFromPdfBinary(buffer) {
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('latin1');
  const rawString = textDecoder.decode(bytes);

  const textSnippets = [];
  // Match text in PDF strings: (Text here) Tj or [(T) -10 (e) (xt)] TJ
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(rawString)) !== null) {
    const clean = match[1].replace(/\\([()\\])/g, '$1');
    if (clean.trim()) textSnippets.push(clean);
  }

  // Match array text strings: [(...) ...] TJ
  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(rawString)) !== null) {
    const inner = match[1];
    const subMatch = inner.match(/\(([^)]+)\)/g);
    if (subMatch) {
      const joined = subMatch.map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
      if (joined.trim()) textSnippets.push(joined);
    }
  }

  return textSnippets.join(' ');
}

function cleanExtractedText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .trim();
}
