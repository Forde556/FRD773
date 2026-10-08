/**
 * pdfService.js — «الطباعة والتصدير»
 * Two complementary paths:
 *  1. downloadPdf(): one-click A4 PDF via html2pdf (html2canvas + jsPDF).
 *  2. printDocument(): the browser's native print engine using print.css —
 *     vector-sharp text and perfect Arabic shaping ("Save as PDF").
 * Both honour page-break-inside: avoid so cards never split across sheets.
 */

const A4_WIDTH_PX = 794; // 210mm @ 96dpi

export async function downloadPdf(sourceEl, filename = 'lecture.pdf') {
  if (!sourceEl) throw new Error('لا يوجد محتوى للتصدير');
  const { default: html2pdf } = await import('html2pdf.js');

  const stage = document.createElement('div');
  stage.className = 'pdf-stage';
  stage.style.cssText = `position:fixed;left:-20000px;top:0;width:${A4_WIDTH_PX}px;background:#fff;z-index:-1;`;
  const clone = sourceEl.cloneNode(true);
  clone.classList.add('pdf-render');
  clone.style.display = 'block';
  stage.appendChild(clone);
  document.body.appendChild(stage);

  // Wait for diagrams/images inside the clone to decode.
  await Promise.all(
    [...clone.querySelectorAll('img')].map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }),
    ),
  );
  if (document.fonts?.ready) await document.fonts.ready;

  try {
    await html2pdf()
      .set({
        margin: [12, 12, 14, 12],
        filename,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: A4_WIDTH_PX },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.print-slide', '.print-block', '.print-figure', '.print-pearl'] },
      })
      .from(clone)
      .save();
  } finally {
    stage.remove();
  }
}

export function printDocument() {
  document.documentElement.classList.add('is-printing');
  const done = () => {
    document.documentElement.classList.remove('is-printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  // Let React flush any pending layout before opening the dialog.
  requestAnimationFrame(() => setTimeout(() => window.print(), 50));
}

export function safeFilename(title) {
  return `${String(title || 'lecture').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'lecture'}.pdf`;
}
