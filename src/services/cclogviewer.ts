import { spawn } from 'child_process';
import { env } from '../config/environment.js';

/**
 * Execute cclogviewer to convert JSONL to HTML
 * @param inputPath - Absolute path to input .jsonl file
 * @param outputPath - Absolute path to output .html file
 * @throws Error if conversion fails or times out
 */
export async function generateHTML(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-input', inputPath, '-output', outputPath];

    const process = spawn(env.CCLOGVIEWER_BIN_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    let stdout = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `cclogviewer failed with code ${code}: ${stderr || stdout}`
          )
        );
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to execute cclogviewer: ${error.message}`));
    });

    // Timeout handler
    const timeout = setTimeout(() => {
      process.kill('SIGTERM');
      reject(new Error('cclogviewer execution timeout'));
    }, env.CCLOGVIEWER_TIMEOUT_MS);

    process.on('close', () => {
      clearTimeout(timeout);
    });
  });
}
