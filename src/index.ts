import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from './config/environment.js';
import { securityHeaders } from './middleware/security.js';
import { initializeGenerationMarker } from './services/cache.js';
import uploadRoute from './routes/upload.js';
import viewRoute from './routes/view.js';

const app = new Hono();

// Apply security headers to all routes
app.use('*', securityHeaders);

// Serve static files (CSS, JS, images)
app.use('/app.js', serveStatic({ path: './public/app.js' }));
app.use('/robots.txt', serveStatic({ path: './public/robots.txt' }));

// Home route - serve upload UI
app.get('/', serveStatic({ path: './public/index.html' }));

// API routes
app.route('/api/upload', uploadRoute);

// View route
app.route('/view', viewRoute);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.notFound((c) => {
  return c.html('<h1>404 - Not Found</h1>', 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error',
    },
    500
  );
});

// Initialize generation marker on startup
async function startup() {
  try {
    console.log('Initializing generation marker system...');
    await initializeGenerationMarker();
    console.log('Generation marker initialized successfully');

    console.log(`Starting server on port ${env.PORT}...`);
    serve(
      {
        fetch: app.fetch,
        port: env.PORT,
      },
      (info) => {
        console.log(`Server running at http://localhost:${info.port}`);
        console.log(`Storage path: ${env.STORAGE_PATH}`);
        console.log(`Environment: ${env.NODE_ENV}`);
      }
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startup();
