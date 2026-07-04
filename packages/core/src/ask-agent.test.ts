import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());
const mockRunSql = vi.hoisted(() => vi.fn());
const mockListCategories = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

vi.mock('./run-sql.js', () => ({ runSql: mockRunSql }));
vi.mock('./list-categories.js', () => ({ listCategories: mockListCategories }));
vi.mock('./schema-context.js', () => ({ SYSTEM_PROMPT: 'mock system prompt' }));
vi.mock('./logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    flush: vi.fn(),
  })),
}));

import { askAgent } from './ask-agent.js';

const toolUse = (id: string, name: string, input: Record<string, unknown>) => ({
  type: 'tool_use' as const,
  id,
  name,
  input,
});

const textResponse = (text: string) => ({
  stop_reason: 'end_turn',
  content: [{ type: 'text', text }],
  usage: { input_tokens: 10, output_tokens: 5 },
});

const toolUseResponse = (id: string, name: string, input: Record<string, unknown>) => ({
  stop_reason: 'tool_use',
  content: [toolUse(id, name, input)],
  usage: { input_tokens: 100, output_tokens: 30 },
});

describe('askAgent', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockRunSql.mockReset();
    mockListCategories.mockReset();
  });

  it('returns text answer when LLM responds with end_turn', async () => {
    mockCreate.mockResolvedValueOnce(textResponse('Nincs kérdés, csak válasz.'));

    const result = await askAgent('Teszt kérdés');

    expect(result).toBe('Nincs kérdés, csak válasz.');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('runs runSql and returns answer after successful tool_use', async () => {
    mockRunSql.mockResolvedValueOnce([{ name: 'Aloe vera', price: 2490 }]);
    mockCreate
      .mockResolvedValueOnce(toolUseResponse('t1', 'runSql', { query: 'SELECT * FROM products LIMIT 5' }))
      .mockResolvedValueOnce(textResponse('Aloe vera kapható, 2490 Ft.'));

    const result = await askAgent('Mutass növényeket');

    expect(result).toBe('Aloe vera kapható, 2490 Ft.');
    expect(mockRunSql).toHaveBeenCalledWith('SELECT * FROM products LIMIT 5');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('sends is_error tool_result when runSql throws, enabling LLM to retry', async () => {
    mockRunSql
      .mockRejectedValueOnce(new Error('column "color" does not exist'))
      .mockResolvedValueOnce([{ name: 'Kék kaktusz' }]);

    mockCreate
      // 1. hívás: rossz SQL-t generál (nem létező oszlop)
      .mockResolvedValueOnce(toolUseResponse('t1', 'runSql', { query: "SELECT * FROM products WHERE color = 'kék'" }))
      // 2. hívás: megkapja a hibát, javított SQL-lel próbálja újra
      .mockResolvedValueOnce(toolUseResponse('t2', 'runSql', { query: "SELECT * FROM products WHERE name ILIKE '%kék%' LIMIT 5" }))
      // 3. hívás: sikeres eredmény alapján válaszol
      .mockResolvedValueOnce(textResponse('Megtaláltam a kék növényeket.'));

    const result = await askAgent('Kék növényeket keresek');

    // helyes végeredmény
    expect(result).toBe('Megtaláltam a kék növényeket.');

    // runSql kétszer futott: egyszer hibával, egyszer sikeresen
    expect(mockRunSql).toHaveBeenCalledTimes(2);
    expect(mockRunSql).toHaveBeenNthCalledWith(1, "SELECT * FROM products WHERE color = 'kék'");
    expect(mockRunSql).toHaveBeenNthCalledWith(2, "SELECT * FROM products WHERE name ILIKE '%kék%' LIMIT 5");

    // az LLM háromszor kapott hívást
    expect(mockCreate).toHaveBeenCalledTimes(3);

    // A messages tömb referencia szerint kerül a mockba — a végső állapotban keressük a t1 hibát.
    // (Minden mock.calls[n][0].messages ugyanaz a mutált tömb — referencia, nem másolat.)
    const allMessages = mockCreate.mock.calls[0][0].messages as Array<{
      role: string;
      content: unknown;
    }>;

    type ToolResultBlock = { tool_use_id?: string; is_error?: boolean; content: string };
    let t1ErrorResult: ToolResultBlock | undefined;
    for (const msg of allMessages) {
      if (msg.role !== 'user' || !Array.isArray(msg.content)) continue;
      const found = (msg.content as ToolResultBlock[]).find((b) => b.tool_use_id === 't1');
      if (found) { t1ErrorResult = found; break; }
    }

    expect(t1ErrorResult?.is_error).toBe(true);
    expect(t1ErrorResult?.content).toContain('column "color" does not exist');
  });

  it('runs listCategories and returns answer after tool_use', async () => {
    mockListCategories.mockResolvedValueOnce(['kaktusz', 'pozsgás', 'szobanövény']);
    mockCreate
      .mockResolvedValueOnce(toolUseResponse('t1', 'listCategories', {}))
      .mockResolvedValueOnce(textResponse('Három kategória van: kaktusz, pozsgás, szobanövény.'));

    const result = await askAgent('Milyen kategóriák vannak?');

    expect(result).toBe('Három kategória van: kaktusz, pozsgás, szobanövény.');
    expect(mockListCategories).toHaveBeenCalledTimes(1);
  });
});
