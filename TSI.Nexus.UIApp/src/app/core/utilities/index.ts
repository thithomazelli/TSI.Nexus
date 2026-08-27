export * from './web-api-response.model';
export * from './format-utils';
export * from './document-branding';
export * from './document-template-renderer';

// letterhead-pdf.ts is deliberately NOT re-exported here: it pulls in jsPDF/html2canvas (~1MB),
// and this barrel is imported by @nexus/core, which nearly every service in the app imports.
// Re-exporting it would drag those PDF libraries into the app's initial bundle for everyone, even
// though downloadLetterheadPdf() is only ever called from 3 "baixar PDF" buttons. Those call sites
// import it directly via a dynamic import() instead - see quote/order/trip-details-page.
