import { Hono } from 'hono';
import { viewRateLimit } from '../middleware/rate-limit.js';
import { sanitizeId } from '../utils/path-sanitizer.js';
import {
  sessionExists,
  htmlExists,
  readHTML,
  getJSONLPath,
  getHTMLPath,
  readCacheMarker,
  storeCacheMarker,
} from '../services/storage.js';
import { generateHTML } from '../services/cclogviewer.js';
import { getGenerationHash } from '../services/cache.js';

const view = new Hono();

view.get('/:id', viewRateLimit, async (c) => {
  try {
    const id = c.req.param('id');

    // Validate ID format
    try {
      sanitizeId(id);
    } catch {
      return c.html('<h1>Invalid session ID</h1>', 400);
    }

    // Check if session exists
    if (!(await sessionExists(id))) {
      return c.html('<h1>Session not found</h1>', 404);
    }

    // Get current generation hash
    const currentHash = await getGenerationHash();

    // Check if we need to regenerate HTML
    let needsRegeneration = false;

    if (await htmlExists(id)) {
      // Check cache marker
      const marker = await readCacheMarker(id);

      if (!marker || marker.generationHash !== currentHash) {
        needsRegeneration = true;
      }
    } else {
      needsRegeneration = true;
    }

    // Regenerate HTML if needed
    if (needsRegeneration) {
      console.log(`Regenerating HTML for session ${id}`);

      const jsonlPath = getJSONLPath(id);
      const htmlPath = getHTMLPath(id);

      try {
        await generateHTML(jsonlPath, htmlPath);
        await storeCacheMarker(id, currentHash);
      } catch (error) {
        console.error('Regeneration error:', error);
        return c.html(
          '<h1>Error generating HTML</h1><p>Please try again later.</p>',
          500
        );
      }
    }

    // Read and serve HTML
    const html = await readHTML(id);

    // Set cache headers for browser caching
    c.header('Cache-Control', 'public, max-age=3600');
    c.header('ETag', currentHash.substring(0, 16));

    return c.html(html);
  } catch (error) {
    console.error('View error:', error);
    return c.html('<h1>Internal server error</h1>', 500);
  }
});

export default view;
