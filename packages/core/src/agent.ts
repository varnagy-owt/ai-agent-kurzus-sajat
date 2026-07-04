import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './schema-context.js';

const MODEL = 'claude-sonnet-4-6';

const client = new Anthropic();

export async function sendMessage(question: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '(üres válasz)';
}
