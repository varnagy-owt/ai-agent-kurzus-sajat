import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockQuery })),
}));

describe('listCategories', () => {
  beforeEach(() => {
    vi.resetModules();
    mockQuery.mockReset();
    process.env.DATABASE_URL_READONLY = 'postgresql://test:test@localhost/test';
  });

  it('returns distinct categories as string array', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { category: 'fa-cserje' },
        { category: 'kaktusz' },
        { category: 'pozsgás' },
        { category: 'szobanövény' },
      ],
    });

    const { listCategories } = await import('./list-categories.js');
    const result = await listCategories();

    expect(result).toEqual(['fa-cserje', 'kaktusz', 'pozsgás', 'szobanövény']);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT DISTINCT category FROM products ORDER BY category',
    );
  });

  it('returns empty array when no categories exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const { listCategories } = await import('./list-categories.js');
    const result = await listCategories();

    expect(result).toEqual([]);
  });

  it('throws when DATABASE_URL_READONLY is not set', async () => {
    delete process.env.DATABASE_URL_READONLY;

    const { listCategories } = await import('./list-categories.js');
    await expect(listCategories()).rejects.toThrow('DATABASE_URL_READONLY');
  });
});
