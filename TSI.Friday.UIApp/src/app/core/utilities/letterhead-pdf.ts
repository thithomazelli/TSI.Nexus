import html2pdf from 'html2pdf.js';
import { SERODIO_COMPANY } from './document-branding';

/**
 * Wraps one or more page fragments (already-built inner HTML) with Serodio's letterhead
 * background repeated on every page, and the shared print styles used by every exported
 * document (contrato, ordem de serviço, orçamento) so they all look like they came from the
 * same template the company already uses on paper.
 */
export function buildLetterheadDocument(pagesHtml: string[]): string {
  const pages = pagesHtml
    .map(
      (page, index) => `
        <div class="pdf-page" style="${index > 0 ? 'page-break-before: always;' : ''}">
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
          background-image: url('${SERODIO_COMPANY.letterheadPath}');
          background-size: 210mm 297mm;
          background-repeat: no-repeat;
          background-position: top left;
          padding: 42mm 18mm 32mm 18mm;
          font-size: 11px;
          line-height: 1.5;
          position: relative;
          box-sizing: border-box;
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
        .pdf-letterhead-root .signature-image {
          max-height: 32px;
          margin-bottom: -6px;
        }
      </style>
      ${pages}
    </div>
  `;
}

/**
 * Renders the given letterhead document off-screen and downloads it as a PDF, reusing the same
 * html2pdf.js pipeline already used by the Payments report export.
 */
export function downloadLetterheadPdf(pagesHtml: string[], filename: string): void {
  const documentHtml = buildLetterheadDocument(pagesHtml);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.innerHTML = documentHtml;
  document.body.appendChild(tempDiv);

  const options: Record<string, unknown> = {
    margin: 0,
    filename,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css'] },
  };

  html2pdf()
    .from(tempDiv)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(options as any)
    .save()
    .finally(() => {
      document.body.removeChild(tempDiv);
    });
}
