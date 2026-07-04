import 'dotenv/config';
import readline from 'node:readline';
import { Command } from 'commander';
import { sendMessage } from '@plantbase/core';

const program = new Command();

program
  .name('plantbase')
  .description('Plantbase AI agent — növénykatalógus természetes nyelven')
  .version('0.1.0');

async function ask(question: string): Promise<void> {
  try {
    const answer = await sendMessage(question);
    console.log(answer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Hiba: ${message}`);
  }
}

program
  .command('ask [question]')
  .description('Kérdés a növénykatalógusnak')
  .option('--show-prompt', 'Kiírja a teljes üzenettömböt')
  .action(async (question: string | undefined) => {
    if (question) {
      await ask(question);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = () =>
      rl.question('> ', async (line) => {
        const trimmed = line.trim();
        if (trimmed === 'exit') {
          rl.close();
          return;
        }
        if (trimmed) {
          await ask(trimmed);
        }
        prompt();
      });

    prompt();
  });

program.parse();
