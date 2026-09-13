import { toPagedQueryString } from './paged-request.utils';
import { PagedRequest } from '../models/paged-request.model';

function baseRequest(overrides: Partial<PagedRequest> = {}): PagedRequest {
  return { page: 1, pageSize: 20, ...overrides };
}

describe('toPagedQueryString', () => {
  it('should serialize only page/pageSize when nothing else is set', () => {
    // Act
    const qs = toPagedQueryString(baseRequest());
    const params = new URLSearchParams(qs);

    // Assert
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('20');
    expect(params.has('sortField')).toBe(false);
    expect(params.has('quickFilter')).toBe(false);
  });

  it('should include sortField and sortDescending when provided', () => {
    // Act
    const qs = toPagedQueryString(baseRequest({ sortField: 'name', sortDescending: true }));
    const params = new URLSearchParams(qs);

    // Assert
    expect(params.get('sortField')).toBe('name');
    expect(params.get('sortDescending')).toBe('true');
  });

  it('should omit sortDescending when it is false', () => {
    // Act
    const qs = toPagedQueryString(baseRequest({ sortDescending: false }));

    // Assert
    expect(new URLSearchParams(qs).has('sortDescending')).toBe(false);
  });

  it('should include quickFilter, startDate and endDate when provided', () => {
    // Act
    const qs = toPagedQueryString(
      baseRequest({ quickFilter: 'abc', startDate: '2024-01-01', endDate: '2024-01-31' }),
    );
    const params = new URLSearchParams(qs);

    // Assert
    expect(params.get('quickFilter')).toBe('abc');
    expect(params.get('startDate')).toBe('2024-01-01');
    expect(params.get('endDate')).toBe('2024-01-31');
  });

  it('should append every status and type as repeated params', () => {
    // Act
    const qs = toPagedQueryString(baseRequest({ statuses: ['Open', 'Closed'], types: ['A', 'B'] }));
    const params = new URLSearchParams(qs);

    // Assert
    expect(params.getAll('statuses')).toEqual(['Open', 'Closed']);
    expect(params.getAll('types')).toEqual(['A', 'B']);
  });

  it('should omit statuses/types params entirely when the arrays are empty or absent', () => {
    // Act
    const qs = toPagedQueryString(baseRequest({ statuses: [], types: [] }));
    const params = new URLSearchParams(qs);

    // Assert
    expect(params.has('statuses')).toBe(false);
    expect(params.has('types')).toBe(false);
  });

  it('should include lowStockOnly when true and omit it when false', () => {
    // Act / Assert
    expect(
      new URLSearchParams(toPagedQueryString(baseRequest({ lowStockOnly: true }))).get(
        'lowStockOnly',
      ),
    ).toBe('true');
    expect(
      new URLSearchParams(toPagedQueryString(baseRequest({ lowStockOnly: false }))).has(
        'lowStockOnly',
      ),
    ).toBe(false);
  });
});
