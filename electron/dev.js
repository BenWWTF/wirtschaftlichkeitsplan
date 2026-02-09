import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use ts-node or tsx to run electron with TypeScript
const electron = spawn(
  'electron',
  [
    '--require', 'tsx/cjs',
    join(__dirname, 'main.ts')
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' }
  }
);

electron.on('close', (code) => {
  process.exit(code);
});
