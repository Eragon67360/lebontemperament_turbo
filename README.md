# Le Bon Temperament Monorepo

This is a monorepo for Le Bon Temperament's website and admin dashboard, built with Turborepo.

## What's inside?

This turborepo uses [npm](https://www.npmjs.com/) as a package manager. It includes the following packages/apps:

### Apps

- `web`: Le Bon Temperament main website [Next.js](https://nextjs.org) app with [HeroUI](https://heroui.com)
- `admin`: Admin dashboard [Next.js](https://nextjs.org) app with [shadcn/ui](https://ui.shadcn.com)

### Tech Stack

- Next.js 15 (based on React 19)
- Tailwind CSS v4
- TypeScript 5.4
- Supabase
- HeroUI (website)
- shadcn/ui (admin)

### Packages

- `ui`: a shared component library
- `eslint-config-custom`: shared `eslint` configurations
- `tsconfig`: `tsconfig.json`s used throughout the monorepo
- `tailwind-config`: shared Tailwind CSS v4 configurations

### Build

To build all apps and packages, run the following command:

```bash
cd le-bon-temperament
npm run build
```

### Develop

To develop all apps and packages, run the following command:

```bash
cd le-bon-temperament
npm run dev
```

## Apps Details

### Website (web)

The main website for Le Bon Temperament, accessible at `lebontemperament.com`

**Tech Stack:**

- Next.js 15
- React 19
- HeroUI Components
- Supabase
- Tailwind CSS v4
- TypeScript 5.4

### Admin Dashboard (admin)

The admin CMS dashboard, accessible at `admin.lebontemperament.com`

**Tech Stack:**

- Next.js 15
- React 19
- shadcn/ui Components
- Supabase
- Tailwind CSS v4
- TypeScript 5.4

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/your-username/le-bon-temperament.git
```

2. Install dependencies:

```bash
cd le-bon-temperament
npm install
```

3. Create `.env` files:

For website (`apps/web/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For admin (`apps/admin/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development servers:

```bash
npm run dev
```

## Package Scripts

Root `package.json`:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "test": "turbo run test"
  }
}
```

## Workspace Setup

Example `package.json` for the monorepo root:

```json
{
  "name": "le-bon-temperament",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwindcss": "4.0.0",
    "@types/react": "19.0.0",
    "@types/node": "20.11.0",
    "typescript": "5.4.0"
  }
}
```

## Project Structure

```
.
├── apps
│   ├── admin
│   │   ├── app/
│   │   ├── public/
│   │   └── package.json
│   └── web
│       ├── app/
│       ├── public/
│       └── package.json
├── packages
│   ├── ui
│   ├── eslint-config-custom
│   ├── tsconfig
│   └── tailwind-config
├── package.json
├── turbo.json
└── README.md
```

## Tailwind CSS v4 Configuration

Example `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Your custom extensions
    },
  },
  plugins: [],
};
export default config;
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Create a Pull Request
4. Wait for review and merge

## Useful Links

- [Next.js 15 Documentation](https://nextjs.org)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Turborepo](https://turbo.build/repo)
- [Vercel](https://vercel.com)

## License

MIT © [Le Bon Temperament]
