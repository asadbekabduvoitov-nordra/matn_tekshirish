# Matn Tekshirish - Telegram Bot

A scalable Telegram bot built with **Telegraf**, **Express**, **Supabase**, and **TypeScript**.

## Project Structure

```
src/
├── bot/                    # Telegram bot logic
│   ├── commands/           # Bot commands (/start, /help, etc.)
│   ├── handlers/           # Message and event handlers
│   ├── middleware/         # Bot middleware (auth, logging, errors)
│   ├── scenes/             # Telegraf scenes for multi-step flows
│   └── index.ts            # Bot initialization
├── config/                 # Configuration and environment
│   └── env.ts              # Environment validation with Zod
├── lib/                    # Shared libraries
│   ├── logger.ts           # Pino logger
│   └── supabase.ts         # Supabase client
├── server/                 # Express server
│   └── index.ts            # Server with webhook support
├── services/               # Business logic layer
│   └── user.service.ts     # User CRUD operations
├── types/                  # TypeScript types
│   ├── context.ts          # Bot context types
│   └── database.types.ts   # Supabase generated types
├── utils/                  # Utility functions
│   └── helpers.ts          # Common helpers
└── index.ts                # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Telegram Bot Token (from @BotFather)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your credentials:
   ```
   BOT_TOKEN=your_telegram_bot_token
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   ```

### Development

Run in development mode (polling):
```bash
pnpm dev
```

### Production

Build and start:
```bash
pnpm build
pnpm start
```

For production, set `NODE_ENV=production` and configure webhook:
```
NODE_ENV=production
WEBHOOK_DOMAIN=https://your-domain.com
WEBHOOK_SECRET=your_secret
```

## Architecture

### Bot Layer
- **Commands**: Individual command handlers in separate files
- **Handlers**: Event handlers for messages, callbacks, etc.
- **Middleware**: Request pipeline (auth → logging → error handling)
- **Scenes**: Multi-step conversation flows using Telegraf Scenes

### Service Layer
- Business logic separated from bot handlers
- Database operations through Supabase client
- Type-safe with generated database types

### Server Layer
- Express server for webhooks and health checks
- Supports both polling (dev) and webhook (prod) modes

## Adding New Features

### New Command
1. Create `src/bot/commands/mycommand.command.ts`
2. Export handler function
3. Register in `src/bot/commands/index.ts`

### New Scene
1. Create `src/bot/scenes/myscene.scene.ts`
2. Export scene
3. Add to stage in `src/bot/scenes/index.ts`

### New Service
1. Create `src/services/myservice.service.ts`
2. Export service instance
3. Use in commands/handlers

## Scripts

- `pnpm dev` - Development with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Type checking
- `pnpm lint` - Linting

## License

ISC
