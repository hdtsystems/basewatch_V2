# Basewatch V2

## Tech Stack Overview

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)

### Backend
- **Database & Auth:** Supabase (PostgreSQL)
- **Client Library:** @supabase/supabase-js
- **Data Fetching:** React Server Components

### Development
- **Package Manager:** npm
- **Linting:** ESLint with Next.js config
- **Build Tool:** Next.js built-in (Turbopack in dev)

---

## Folder Structure

```
basewatch_V2/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
│       ├── supabase.ts       # Supabase client setup
│       └── utils.ts          # Helper functions (cn, etc.)
├── public/                   # Static assets
├── features/                 # Feature specifications
├── .claude/                  # AI agent configurations
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
└── package.json              # Dependencies
```

---

## Environment Variables

Create a `.env.local` file in the project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Server-side only (never expose to browser)
# SUPABASE_SECRET_KEY=your_secret_key
```

### How to get these values:
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings > API
3. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **Publishable Key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

See `.env.local.example` for a template.

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linting
npm run lint
```

---

## Next Steps for Development

1. **Set up Supabase project**
   - Create a new project at supabase.com
   - Add credentials to `.env.local`

2. **Define your database schema**
   - Use Supabase Dashboard or migrations
   - Set up Row Level Security (RLS) policies

3. **Build your first feature**
   - Create pages in `src/app/`
   - Add components in `src/components/`
   - Use shadcn/ui for consistent UI

4. **Add authentication (optional)**
   - Supabase Auth is included in the client
   - Implement sign-up/sign-in flows

5. **Deploy**
   - Push to GitHub
   - Connect to Vercel for automatic deployments

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |

---

## Key Files

- [src/lib/supabase.ts](src/lib/supabase.ts) - Supabase client configuration
- [src/lib/utils.ts](src/lib/utils.ts) - Utility functions (cn for class merging)
- [src/app/layout.tsx](src/app/layout.tsx) - Root layout with providers
- [tailwind.config.ts](tailwind.config.ts) - Tailwind + shadcn/ui theme config
