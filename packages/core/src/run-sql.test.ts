import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockQuery })),
}));

describe('runSql', () => {
  beforeEach(() => {
    vi.resetModules();
    mockQuery.mockReset();
    process.env.DATABASE_URL_READONLY = 'postgresql://test:test@localhost/test';
  });

  it('runs a plain SELECT query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const { runSql } = await import('./run-sql.js');
    const rows = await runSql('SELECT * FROM products LIMIT 5');

    expect(rows).toEqual([{ id: 1 }]);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM products LIMIT 5');
  });

  it('allows a single trailing semicolon', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const { runSql } = await import('./run-sql.js');
    const rows = await runSql('SELECT * FROM products LIMIT 5;');

    expect(rows).toEqual([{ id: 1 }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('rejects a second statement appended with a semicolon', async () => {
    const { runSql } = await import('./run-sql.js');

    await expect(
      runSql('SELECT 1; DROP TABLE products'),
    ).rejects.toThrow('Csak egyetlen utasítás engedélyezett');

    // A guard a DB elérése előtt lép közbe: a pool query-je nem futhat le.
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects a second statement even with a trailing semicolon', async () => {
    const { runSql } = await import('./run-sql.js');

    await expect(
      runSql('SELECT 1; DROP TABLE products;'),
    ).rejects.toThrow('Csak egyetlen utasítás engedélyezett');

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects non-SELECT queries', async () => {
    const { runSql } = await import('./run-sql.js');

    await expect(runSql('DELETE FROM products')).rejects.toThrow(
      'Csak SELECT lekérdezés engedélyezett',
    );

    expect(mockQuery).not.toHaveBeenCalled();
  });
});
