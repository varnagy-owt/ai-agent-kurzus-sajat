import readline from 'node:readline';
import { Command } from 'commander';

const program = new Command();

program
  .name('plantbase')
  .description('Plantbase AI agent — növénykatalógus természetes nyelven')
  .version('0.1.0');

program
  .command('ask [question]')
  .description('Kérdés a növénykatalógusnak')
  .option('--show-prompt', 'Kiírja a teljes üzenettömböt')
  .action((question: string | undefined) => {
    if (question) {
      console.log(question);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = () =>
      rl.question('> ', (line) => {
        if (line.trim() === 'exit') {
          rl.close();
          return;
        }
        console.log(line);
        prompt();
      });

    prompt();
  });

program.parse();
