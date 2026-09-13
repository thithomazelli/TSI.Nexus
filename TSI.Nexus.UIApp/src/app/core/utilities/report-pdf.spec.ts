import { buildReportPageElement, chunkRows } from './report-pdf';

// downloadReportPdf() itself orchestrates html2canvas (real Canvas 2D rendering) and jsPDF - not
// meaningfully unit-testable under jsdom, and @angular/build:unit-test's vitest runner does not
// support vi.mock()/vi.hoisted() (even for non-relative npm packages: it throws "were defined
// outside of the module's top level scope" regardless of specifier, since the builder's own
// bundling pipeline runs ahead of vitest's mock-hoisting transform). The pagination boundary is
// the only pure logic worth isolating here; the rest is covered by manual verification of the
// report-download flow in a real browser (see docs/spec-12, Fase 5 checklist).
describe('chunkRows', () => {
  it('should return a single empty chunk when the input is empty', () => {
    // Act
    // Assert
    expect(chunkRows([], 30)).toEqual([[]]);
  });

  it('should return a single chunk when rows fit within one page', () => {
    // Arrange
    const rows = Array.from({ length: 10 }, (_, i) => i);

    // Act
    // Assert
    expect(chunkRows(rows, 30)).toEqual([rows]);
  });

  it('should split rows into full chunks with no trailing empty one when the row count is exactly divisible by the page size', () => {
    // Arrange
    const rows = Array.from({ length: 60 }, (_, i) => i);

    // Act
    const chunks = chunkRows(rows, 30);

    // Assert
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(30);
    expect(chunks[1]).toHaveLength(30);
  });

  it('should put the remainder in a final smaller chunk when rows are not evenly divisible', () => {
    // Arrange
    const rows = Array.from({ length: 65 }, (_, i) => i);

    // Act
    const chunks = chunkRows(rows, 30);

    // Assert
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(30);
    expect(chunks[1]).toHaveLength(30);
    expect(chunks[2]).toHaveLength(5);
  });

  it('should preserve row order across chunks when rows are split', () => {
    // Arrange
    const rows = Array.from({ length: 35 }, (_, i) => i);

    // Act
    const chunks = chunkRows(rows, 30);

    // Assert
    expect(chunks.flat()).toEqual(rows);
  });
});

describe('buildReportPageElement', () => {
  it('should build a page with the header, table head, joined rows and totals when called', () => {
    // Act
    const page = buildReportPageElement(
      '<div id="header">Header</div>',
      '<thead><tr><th>Col</th></tr></thead>',
      ['<tr><td>1</td></tr>', '<tr><td>2</td></tr>'],
      '<div id="totals">Total: 2</div>',
    );

    // Assert
    expect(page.style.cssText).toContain('width: 210mm');
    expect(page.querySelector('#header')!.textContent).toBe('Header');
    expect(page.querySelectorAll('tbody tr').length).toBe(2);
    expect(page.querySelector('#totals')!.textContent).toBe('Total: 2');
  });

  it('should render no totals markup when totalsHtml is null', () => {
    // Act
    const page = buildReportPageElement(
      '<div>Header</div>',
      '<thead></thead>',
      [],
      null,
    );

    // Assert
    expect(page.querySelector('#totals')).toBeNull();
    expect(page.innerHTML).not.toContain('null');
  });
});
