import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export class Logger {
  private readonly filePath: string;
  private buffer: string[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    mkdirSync('logs', { recursive: true });
    this.filePath = join('logs', `${timestamp}.jsonl`);
  }

  log(entry: Record<string, unknown>): void {
    this.buffer.push(
      JSON.stringify({ ts: new Date().toISOString(), ...entry }),
    );
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    appendFileSync(this.filePath, this.buffer.join('\n') + '\n');
    this.buffer = [];
  }

  get path(): string {
    return this.filePath;
  }
}
