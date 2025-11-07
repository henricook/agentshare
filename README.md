# Agent Share

A production-ready service for uploading AI agent session logs, converting them to beautiful HTML using [cclogviewer](https://github.com/Brads3290/cclogviewer), and sharing via secure links.

**Currently Supported:** Claude Code
**Future Support (Aspirational):** Codex, Gemini CLI, and other AI coding assistants

## Features

- **Beautiful Upload UI**: Modern, responsive drag-and-drop interface
- **Secure Sharing**: Cryptographically secure UUID-based links (security by obscurity)
- **Smart Caching**: Regenerates HTML only when cclogviewer binary or config changes
- **Rate Limiting**: Built-in protection against abuse
- **Security Hardened**: Comprehensive security headers, path traversal prevention, and Docker best practices
- **Configurable Storage**: Flexible filesystem-based storage location
- **Production Ready**: Multi-stage Docker build, health checks, non-root user

## Quick Start

### Using Pre-built Docker Image (Recommended)

The easiest way to get started is using the pre-built image from GitHub Container Registry:

```bash
docker run -d \
  --name agent-share \
  -p 8721:8721 \
  -v agent-share-data:/app/storage \
  -e BASE_URL=http://localhost:8721 \
  ghcr.io/henricook/agentshare:latest
```

Or with docker-compose:

```yaml
services:
  agent-share:
    image: ghcr.io/henricook/agentshare:latest
    ports:
      - "8721:8721"
    volumes:
      - agent-share-data:/app/storage:rw
    environment:
      - BASE_URL=http://localhost:8721

volumes:
  agent-share-data:
```

Then access the application at http://localhost:8721.

### Building from Source

1. **Clone the repository**

```bash
git clone https://github.com/henricook/agent-share.git
cd agent-share
```

2. **Build and run with docker-compose**

```bash
docker-compose up -d --build
```

3. **Access the application**

Open http://localhost:8721 in your browser.

### Local Development

1. **Prerequisites**

- Node.js 20+
- Go 1.23+ (for installing cclogviewer)

2. **Install cclogviewer**

```bash
go install github.com/brads3290/cclogviewer/cmd/cclogviewer@latest
```

This installs cclogviewer to `~/go/bin/cclogviewer`. Make sure `~/go/bin` is in your PATH, or update `.env` with the full path.

3. **Install dependencies**

```bash
npm install
```

4. **Create storage directory**

```bash
mkdir -p storage
```

5. **Copy environment file**

```bash
cp .env.example .env
```

Optionally, update `CCLOGVIEWER_BIN_PATH` in `.env` if cclogviewer is not in your PATH:

```bash
CCLOGVIEWER_BIN_PATH=/home/youruser/go/bin/cclogviewer
```

6. **Run in development mode**

```bash
npm run dev
```

7. **Access the application**

Open http://localhost:8721 in your browser.

## Usage

### Uploading a Session

1. Visit the home page at `/`
2. Drag and drop your `.jsonl` file or click to browse
3. Click "Upload & Generate Link"
4. Copy the shareable link and share it with your team

### Viewing a Session

Visit the generated link (e.g., `http://localhost:8721/view/{uuid}`) to view the converted HTML session log.

## Configuration

All configuration is done via environment variables. See `.env.example` for all available options.

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `8721` | Server port |
| `STORAGE_PATH` | `./storage` | Directory for uploaded files |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size |
| `MAX_JSONL_LINES` | `10000000` | Maximum lines in JSONL file |
| `CCLOGVIEWER_BIN_PATH` | `cclogviewer` | Path to cclogviewer binary (assumes in PATH) |
| `RATE_LIMIT_UPLOAD_MAX` | `10` | Max uploads per window |
| `BASE_URL` | `http://localhost:8721` | Base URL for shareable links |

### Docker Configuration

Edit `docker-compose.yml` to customize:

- Port mapping (default: `8721:8721`)
- Storage volume (default: named volume `agent-share-data`)
- Environment variables
- BASE_URL (set to your domain in production)

## Architecture

### Generation Marker System

The service uses a smart caching system:

1. **Global Marker**: Hash of cclogviewer binary + generation config
2. **Per-Upload Marker**: Stored with each session's HTML
3. **Cache Check**: On view, compares markers
4. **Regeneration**: Only regenerates if markers don't match

This means:
- Fast serving when nothing changes
- Automatic regeneration when you update cclogviewer or config
- No manual cache clearing needed

### Security Features

- **UUID v4 IDs**: 122-bit entropy, cryptographically secure
- **Path Traversal Prevention**: Strict validation on all file operations
- **JSONL Validation**: Validates file format and content
- **Rate Limiting**: Per-IP limits on uploads and views
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **Docker Hardening**: Non-root user, capability dropping, read-only where possible
- **No Shell Execution**: Uses `spawn` instead of `exec` to prevent injection

## Project Structure

```
agent-share/
├── src/
│   ├── index.ts              # Main application entry
│   ├── config/
│   │   └── environment.ts    # Environment configuration
│   ├── routes/
│   │   ├── upload.ts         # POST /api/upload
│   │   └── view.ts           # GET /view/:id
│   ├── services/
│   │   ├── storage.ts        # File operations
│   │   ├── cclogviewer.ts    # Binary wrapper
│   │   └── cache.ts          # Generation marker logic
│   ├── middleware/
│   │   ├── validation.ts     # File validation
│   │   ├── rate-limit.ts     # Rate limiting
│   │   └── security.ts       # Security headers
│   └── utils/
│       ├── id-generator.ts   # UUID generation
│       └── path-sanitizer.ts # Path validation
├── public/
│   ├── index.html            # Upload UI
│   └── app.js                # Client-side logic
├── storage/
│   └── generation.config.json # Generation configuration
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Container orchestration
└── README.md
```

## API Endpoints

### POST /api/upload

Upload a JSONL session file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (JSONL file)

**Response:**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "http://localhost:8721/view/550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /view/:id

View a converted session.

**Response:** HTML page

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Deployment

### Production Deployment

1. **Update BASE_URL** in `docker-compose.yml` or via environment variable:

```yaml
environment:
  - BASE_URL=https://your-domain.com
```

Or with docker run:
```bash
docker run -d \
  --name agent-share \
  -p 8721:8721 \
  -v agent-share-data:/app/storage \
  -e BASE_URL=https://your-domain.com \
  ghcr.io/henricook/agentshare:latest
```

2. **Set up reverse proxy** (nginx, Caddy, Traefik, etc.) with SSL in front of the application

3. **Optional: Configure persistent storage** with bind mounts instead of named volumes if needed:

```yaml
volumes:
  - /path/to/persistent/storage:/app/storage:rw
```

## Updating cclogviewer

### Using Pre-built Image

Pull the latest image which includes the latest cclogviewer:

```bash
docker pull ghcr.io/henricook/agentshare:latest
docker restart agent-share
```

Or with docker-compose:
```bash
docker-compose pull
docker-compose up -d
```

### Building from Source

Rebuild the Docker image to pull the latest cclogviewer:

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Local Development

Update cclogviewer using go install:

```bash
go install github.com/brads3290/cclogviewer/cmd/cclogviewer@latest
```

**Note:** All existing sessions will automatically regenerate on next view (generation marker will be different)

## Customizing Generation

Edit `storage/generation.config.json` to change generation settings:

```json
{
  "version": "1.0.0",
  "styling": {
    "customCSS": false,
    "theme": "default"
  },
  "cclogviewerArgs": []
}
```

Changes to this file will trigger HTML regeneration for all sessions.

## Troubleshooting

### Sessions not generating HTML

Check logs:
```bash
docker-compose logs -f agent-share
```

Verify cclogviewer is available:
```bash
docker-compose exec agent-share which cclogviewer
```

### Storage permission issues

The Docker setup uses a named volume which handles permissions automatically. If you have issues, you can inspect the volume:
```bash
docker volume inspect agent-share-data
```

### Rate limit errors

Adjust rate limits in `.env` or `docker-compose.yml`:
```bash
RATE_LIMIT_UPLOAD_MAX=20
RATE_LIMIT_VIEW_MAX=200
```

## License

MIT

## Credits

- Built with [Hono](https://hono.dev/)
- Powered by [cclogviewer](https://github.com/Brads3290/cclogviewer)
- UI styled with [Tailwind CSS](https://tailwindcss.com/)
