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
  .action(() => {
    console.log('(coming soon)');
  });

program.parse();
