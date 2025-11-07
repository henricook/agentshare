import { Context, Next } from 'hono';
import { env } from '../config/environment.js';

const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
const MAX_LINES = env.MAX_JSONL_LINES;

/**
 * Middleware to validate uploaded JSONL files
 * Checks file type, size, format, and content validity
 */
export async function validateJSONL(c: Context, next: Next): Promise<Response> {
  const body = await c.req.parseBody();
  const file = body.file;

  // Check file exists
  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'No file uploaded' }, 400);
  }

  // Check extension
  if (!file.name.endsWith('.jsonl')) {
    return c.json({ success: false, error: 'Only .jsonl files allowed' }, 400);
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { success: false, error: `File too large (max ${env.MAX_FILE_SIZE_MB}MB)` },
      413
    );
  }

  // Check if file is empty
  if (file.size === 0) {
    return c.json({ success: false, error: 'File is empty' }, 400);
  }

  // Validate JSONL content
  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return c.json({ success: false, error: 'File contains no valid lines' }, 400);
  }

  if (lines.length > MAX_LINES) {
    return c.json(
      { success: false, error: `Too many lines (max ${MAX_LINES.toLocaleString()})` },
      413
    );
  }

  // Validate each line is valid JSON
  try {
    for (let i = 0; i < lines.length; i++) {
      JSON.parse(lines[i]);
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    return c.json(
      { success: false, error: `Invalid JSONL format: ${errorMsg}` },
      400
    );
  }

  // Store validated file and content in context for the route handler
  c.set('validatedFile', file);
  c.set('validatedContent', text);

  await next();
  return c.res;
}
