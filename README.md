# Le Bon Temperament Monorepo

This is a comprehensive monorepo for Le Bon Temperament's digital ecosystem, built with Turborepo. It includes a website, admin dashboard, and mobile application.

## What's inside?

This turborepo uses [npm](https://www.npmjs.com/) as a package manager. It includes the following packages/apps:

### Apps

- `website`: Le Bon Temperament main website [Next.js](https://nextjs.org) app with [HeroUI](https://heroui.com)
- `admin`: Admin dashboard [Next.js](https://nextjs.org) app with [shadcn/ui](https://ui.shadcn.com)
- `mobile_app`: Flutter mobile application for iOS and Android

### Tech Stack

- **Frontend**: Next.js 15 (based on React 19), Tailwind CSS v4, TypeScript 5.8
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Mobile**: Flutter with Riverpod state management
- **UI Libraries**: HeroUI (website), shadcn/ui (admin)
- **Build Tool**: Turborepo

### Packages

- `ui`: a shared component library
- `eslint-config`: shared `eslint` configurations
- `typescript-config`: `tsconfig.json`s used throughout the monorepo

## Apps Details

### Website (website)

The main website for Le Bon Temperament, accessible at `lebontemperament.com`

**Features:**

- 🏠 **Homepage**: Hero section, latest projects showcase, about section
- 🎵 **Concerts**: Upcoming and past concerts with detailed information
- 👥 **Discover**: Information about the ensemble, history, and members
- 📸 **Gallery**: Photo and video galleries with lightbox functionality
- 📞 **Contact**: Contact form with Google Maps integration
- 👤 **Members Area**: Private section for ensemble members
  - Calendar of rehearsals and events
  - Work materials and file sharing
  - Member directory
  - Administrative documents

**Tech Stack:**

- Next.js 15 with App Router
- React 19
- HeroUI Components
- Supabase for backend
- Tailwind CSS v4
- TypeScript 5.8
- Cloudinary for media management
- Stripe for payments
- Google APIs integration

### Admin Dashboard (admin)

The comprehensive CMS dashboard, accessible at `admin.lebontemperament.com`

**Features:**

- 👥 **User Management**: Add, edit, and manage user accounts and roles
- 🎵 **Public Site Management**:
  - Homepage content (projects, about section, CDs)
  - Concert management and scheduling
  - Media library (photos and videos)
  - Contact information
- 📅 **Event Management**: Create and manage rehearsals and events
- 🗂️ **File Management**: Google Drive integration for work materials
- 🐛 **Bug Reports**: System for tracking and managing bug reports
- 📊 **Analytics**: Dashboard with key metrics and statistics

**Tech Stack:**

- Next.js 15 with App Router
- React 19
- shadcn/ui Components
- Supabase for backend
- Tailwind CSS v4
- TypeScript 5.8
- Radix UI primitives

### Mobile App (mobile_app)

Flutter mobile application for iOS and Android

**Features:**

- 📱 **Cross-platform**: iOS and Android support
- 🔐 **Authentication**: Secure login with Supabase
- 📅 **Calendar**: View rehearsals and events
- 📁 **File Access**: Access to work materials and documents
- 🔔 **Notifications**: Local notifications for events
- 🌐 **Offline Support**: Cached data for offline access
- 📊 **Real-time Updates**: Live synchronization with backend

**Tech Stack:**

- Flutter framework
- Riverpod for state management
- Supabase Flutter SDK
- Hive for local storage
- Go Router for navigation
- Dio for HTTP requests

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/your-username/le-bon-temperament.git
cd le-bon-temperament
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` files:

For website (`apps/website/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=https://www.lebontemperament.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

For admin (`apps/admin/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For mobile app (`apps/mobile_app/.env`):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development servers:

```bash
# Start all apps
npm run dev

# Start specific apps
npm run dev --filter=website
npm run dev --filter=admin
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
    "check-types": "turbo run check-types"
  }
}
```

## Project Structure

```
.
├── apps
│   ├── website/                 # Main website
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # React components
│   │   ├── public/            # Static assets
│   │   └── package.json
│   ├── admin/                  # Admin dashboard
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # React components
│   │   └── package.json
│   └── mobile_app/            # Flutter mobile app
│       ├── lib/               # Dart source code
│       ├── android/           # Android-specific files
│       ├── ios/               # iOS-specific files
│       └── pubspec.yaml
├── packages
│   ├── ui/                    # Shared UI components
│   ├── eslint-config/         # Shared ESLint config
│   └── typescript-config/     # Shared TypeScript config
├── supabase/                  # Database migrations
├── package.json
├── turbo.json
└── README.md
```

## Development Workflow

### Website Development

```bash
cd apps/website
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run check-types  # Type checking
```

### Admin Dashboard Development

```bash
cd apps/admin
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run check-types  # Type checking
```

### Mobile App Development

```bash
cd apps/mobile_app
flutter pub get      # Install dependencies
flutter run          # Run on connected device/emulator
flutter build apk    # Build Android APK
flutter build ios    # Build iOS app
```

## Database Schema

The project uses Supabase with the following main tables:

- `profiles`: User profiles and roles
- `concerts`: Concert information and scheduling
- `events`: General events and rehearsals
- `projects`: Musical projects and performances
- `bug_reports`: System bug tracking
- `groups`: Ensemble groups (adults, youth, children, orchestra)
- `programs`: Musical programs and seasons

## Deployment

### Website & Admin Dashboard

- Deployed on Vercel
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard

### Mobile App

- iOS: App Store Connect
- Android: Google Play Console
- Automated builds with GitHub Actions

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting: `npm run lint && npm run check-types`
4. Create a Pull Request
5. Wait for review and merge

## Useful Links

- [Next.js 15 Documentation](https://nextjs.org)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com)
- [HeroUI](https://heroui.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Flutter](https://flutter.dev)
- [Turborepo](https://turbo.build/repo)
- [Vercel](https://vercel.com)

## License

MIT © [Le Bon Temperament]
