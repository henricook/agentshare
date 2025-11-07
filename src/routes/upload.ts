import { Hono } from 'hono';
import { uploadRateLimit } from '../middleware/rate-limit.js';
import { validateJSONL } from '../middleware/validation.js';
import { generateId } from '../utils/id-generator.js';
import {
  storeJSONL,
  getJSONLPath,
  getHTMLPath,
  storeCacheMarker,
} from '../services/storage.js';
import { generateHTML } from '../services/cclogviewer.js';
import { getGenerationHash } from '../services/cache.js';
import { env } from '../config/environment.js';

type Variables = {
  validatedFile: File;
  validatedContent: string;
};

const upload = new Hono<{ Variables: Variables }>();

upload.post('/', uploadRateLimit, validateJSONL, async (c) => {
  try {
    // Get validated file content from middleware
    const content = c.get('validatedContent');

    // Generate unique ID
    const id = generateId();

    // Store JSONL file
    await storeJSONL(id, content);

    // Generate HTML using cclogviewer
    const jsonlPath = getJSONLPath(id);
    const htmlPath = getHTMLPath(id);

    try {
      await generateHTML(jsonlPath, htmlPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('cclogviewer error:', errorMsg);
      return c.json(
        {
          success: false,
          error: 'Failed to generate HTML view. Please try again.',
        },
        500
      );
    }

    // Store cache marker
    const generationHash = await getGenerationHash();
    await storeCacheMarker(id, generationHash);

    // Return success with shareable URL
    const url = `${env.BASE_URL}/view/${id}`;

    return c.json({
      success: true,
      id,
      url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to process upload. Please try again.',
      },
      500
    );
  }
});

export default upload;
