import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { SYSTEM_PROMPT } from './schema-context.js';
import { runSql } from './run-sql.js';
import { listCategories } from './list-categories.js';
import { Logger } from './logger.js';

const MODEL = 'claude-sonnet-4-6';

const client = new Anthropic();

const RunSqlInput = z.object({ query: z.string().min(1) });

const LIST_CATEGORIES_TOOL: Anthropic.Tool = {
  name: 'listCategories',
  description:
    'Visszaadja az összes elérhető növénykategóriát a katalógusból. Kategória-kérdéseknél ezt használd.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const RUN_SQL_TOOL: Anthropic.Tool = {
  name: 'runSql',
  description:
    'Read-only SQL lekérdezés a products katalóguson. Csak SELECT engedélyezett.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'A futtatandó SQL SELECT lekérdezés a products tábla felett.',
      },
    },
    required: ['query'],
  },
};

export interface AskAgentOptions {
  showPrompt?: boolean;
}

export async function askAgent(
  question: string,
  opts: AskAgentOptions = {},
): Promise<string> {
  const logger = new Logger();
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: question },
  ];

  logger.log({ type: 'user', content: question });

  for (;;) {
    if (opts.showPrompt) {
      console.log('\n─── System prompt ───');
      console.log(SYSTEM_PROMPT);
      console.log('\n─── Messages ───');
      console.log(JSON.stringify(messages, null, 2));
      console.log('─────────────────\n');
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [LIST_CATEGORIES_TOOL, RUN_SQL_TOOL],
      messages,
    });

    logger.log({
      type: 'assistant_response',
      stop_reason: response.stop_reason,
      usage: response.usage,
      content: response.content,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text') as
        | Anthropic.TextBlock
        | undefined;
      const answer = textBlock?.text ?? '(üres válasz)';
      logger.log({ type: 'final_answer', answer });
      logger.flush();
      return answer;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const toolBlock = block as Anthropic.ToolUseBlock;

        if (toolBlock.name === 'listCategories') {
          logger.log({ type: 'tool_call', id: toolBlock.id, tool: 'listCategories' });
          try {
            const categories = await listCategories();
            logger.log({ type: 'tool_result', id: toolBlock.id, count: categories.length });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: JSON.stringify(categories),
            });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            logger.log({ type: 'tool_error', id: toolBlock.id, error: errMsg });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: errMsg,
              is_error: true,
            });
          }
          continue;
        }

        const parsed = RunSqlInput.safeParse(toolBlock.input);

        if (!parsed.success) {
          const errMsg = parsed.error.message;
          logger.log({ type: 'tool_error', id: toolBlock.id, error: errMsg });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Hibás input: ${errMsg}`,
            is_error: true,
          });
          continue;
        }

        const { query } = parsed.data;
        logger.log({ type: 'tool_call', id: toolBlock.id, query });

        try {
          const rows = await runSql(query);
          const resultJson = JSON.stringify(rows);
          logger.log({
            type: 'tool_result',
            id: toolBlock.id,
            rows: rows.length,
          });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: resultJson,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          logger.log({ type: 'tool_error', id: toolBlock.id, error: errMsg });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: errMsg,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  logger.flush();
  return '(váratlan leállás)';
}
