import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { COMPANY_BRANDING } from './document-branding';

/**
 * Wraps one or more page fragments (already-built inner HTML) with a CSS-drawn company header
 * repeated on every page, and the shared print styles used by every exported document (contrato,
 * ordem de serviço, orçamento, pedido de venda) so they all look like they came from the same
 * template. The header is plain text/CSS (no logo image) so it works out of the box for any
 * company - just edit the values in document-branding.ts.
 */
export function buildLetterheadDocument(pagesHtml: string[]): string {
  const header = `
    <div class="pdf-header">
      <div class="pdf-header-name">${COMPANY_BRANDING.legalName}</div>
      <div class="pdf-header-details">
        CNPJ ${COMPANY_BRANDING.cnpj} · ${COMPANY_BRANDING.addressLine}<br/>
        ${COMPANY_BRANDING.phone} · ${COMPANY_BRANDING.whatsapp} · ${COMPANY_BRANDING.site}
      </div>
    </div>
  `;

  const pages = pagesHtml
    .map(
      (page, index) => `
        <div class="pdf-page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          ${header}
          ${page}
        </div>
      `,
    )
    .join('');

  return `
    <div class="pdf-letterhead-root">
      <style>
        .pdf-letterhead-root {
          font-family: Arial, Helvetica, sans-serif;
          color: #1a1a1a;
        }
        .pdf-letterhead-root .pdf-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          padding: 14mm 18mm 18mm 18mm;
          font-size: 11px;
          line-height: 1.5;
          position: relative;
          box-sizing: border-box;
        }
        .pdf-letterhead-root .pdf-header {
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .pdf-letterhead-root .pdf-header-name {
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 0.3px;
        }
        .pdf-letterhead-root .pdf-header-details {
          font-size: 9px;
          color: #444;
          margin-top: 3px;
        }
        .pdf-letterhead-root h1 {
          text-align: center;
          font-size: 14px;
          margin: 0 0 12px;
        }
        .pdf-letterhead-root h2 {
          font-size: 12px;
          margin: 14px 0 6px;
          text-transform: uppercase;
        }
        .pdf-letterhead-root p {
          margin: 0 0 8px;
          text-align: justify;
        }
        .pdf-letterhead-root .clause-title {
          font-weight: bold;
        }
        .pdf-letterhead-root table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .pdf-letterhead-root table th,
        .pdf-letterhead-root table td {
          border: 1px solid #999;
          padding: 4px 6px;
          font-size: 10px;
          text-align: left;
        }
        .pdf-letterhead-root table th {
          background: #f0f0f0;
        }
        .pdf-letterhead-root .doc-number {
          text-align: right;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .pdf-letterhead-root .signature-block {
          margin-top: 34px;
          display: flex;
          justify-content: space-between;
        }
        .pdf-letterhead-root .signature-column {
          width: 46%;
          text-align: center;
        }
        .pdf-letterhead-root .signature-line {
          border-top: 1px solid #333;
          margin-top: 4px;
          padding-top: 4px;
          font-size: 10px;
        }
      </style>
      ${pages}
    </div>
  `;
}

/**
 * Waits for every <img> inside the container to finish loading (or fail), so html2canvas doesn't
 * capture a page before its images have decoded.
 */
function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

/**
 * Renders each page separately (its own html2canvas capture) and downloads the result as a PDF.
 *
 * Pages are captured one at a time - rather than rendering the whole multi-page document at once
 * and letting html2pdf.js slice it into pages by CSS page-break position - because that slicing
 * isn't pixel-precise: when a page's real content is a fraction taller than the nominal 297mm, the
 * overflow spills into an extra, mostly-blank page instead of just making that one page slightly
 * taller. Capturing and placing each page's canvas individually avoids that class of bug entirely:
 * a page's content is never split, and any legitimate overflow just makes that one PDF page a bit
 * taller than standard A4 instead of losing or duplicating content.
 */
export async function downloadLetterheadPdf(
  pagesHtml: string[],
  filename: string,
): Promise<void> {
  // html2canvas measures the source element's own layout size to decide what to capture. Hiding
  // it via `position: fixed/absolute` (even off-screen) makes that measurement collapse to zero
  // height, producing a blank PDF - so instead we clip it out of view with a zero-height wrapper
  // and leave the actual content div with completely ordinary, unpositioned layout.
  const hiddenWrapper = document.createElement('div');
  hiddenWrapper.style.height = '0';
  hiddenWrapper.style.overflow = 'hidden';
  document.body.appendChild(hiddenWrapper);

  try {
    const widthMm = 210;
    let pdf: jsPDF | null = null;

    for (const pageHtml of pagesHtml) {
      const pageContainer = document.createElement('div');
      pageContainer.innerHTML = buildLetterheadDocument([pageHtml]);
      hiddenWrapper.appendChild(pageContainer);

      await waitForImages(pageContainer);

      const pageElement = pageContainer.querySelector('.pdf-page') as HTMLElement;
      const canvas = await html2canvas(pageElement, { scale: 2, useCORS: true });
      const heightMm = Math.max(297, (canvas.height / canvas.width) * widthMm);
      const imageData = canvas.toDataURL('image/jpeg', 0.92);

      if (!pdf) {
        pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation: 'portrait' });
      } else {
        pdf.addPage([widthMm, heightMm], 'portrait');
      }
      pdf.addImage(imageData, 'JPEG', 0, 0, widthMm, heightMm);

      hiddenWrapper.removeChild(pageContainer);
    }

    pdf?.save(filename);
  } finally {
    document.body.removeChild(hiddenWrapper);
  }
}
