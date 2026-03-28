# CISSP Study Platform

A comprehensive study platform for CISSP (Certified Information Systems Security Professional) certification preparation.

## Features

- **Dashboard** - Track your progress across all 8 CISSP domains
- **Quiz Mode** - Practice questions with immediate feedback and explanations
- **Exam Simulation** - Full 150-question, 3-hour exam simulation
- **Spaced Repetition Flashcards** - SM-2 algorithm for optimal learning with progress reset capability
- **Study Notes** - Create and organize notes by domain
- **Admin Panel** - Manage questions with CRUD, batch import (JSON/CSV), export, search and filter
- **Bilingual Support** - Full Chinese (中文) and English interface
- **Dark/Light Theme** - Theme toggle for comfortable studying

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Internationalization**: next-intl for bilingual support
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest (unit), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cissp-study
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL
```

4. Start PostgreSQL (using Docker):
```bash
docker-compose up -d
```

5. Push database schema:
```bash
npm run db:push
```

6. Seed the database:
```bash
npm run seed
```

7. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run seed` - Populate database with sample data
- `npm run db:push` - Push Prisma schema to database
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── notes/             # Notes pages
│   ├── flashcards/        # Flashcard study & manage
│   ├── quiz/              # Quiz practice
│   ├── exam/              # Exam simulation
│   └── admin/             # Admin management panel
│       ├── page.tsx       # Admin dashboard
│       └── questions/     # Question CRUD, import/export
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin-sidebar.tsx # Admin navigation sidebar
│   └── *.tsx             # Custom components
├── lib/                   # Utilities and actions
│   ├── actions/          # Server actions (questions, notes, etc.)
│   ├── prisma.ts         # Prisma client
│   └── constants.ts      # App constants
├── prisma/               # Database schema and seed
├── tests/                # Unit tests
└── e2e/                  # E2E tests
```

## CISSP Domains Covered

1. Security and Risk Management
2. Asset Security
3. Security Architecture and Engineering
4. Communication and Network Security
5. Identity and Access Management (IAM)
6. Security Assessment and Testing
7. Security Operations
8. Software Development Security

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
4. Deploy

### Docker

```bash
docker build -t cissp-study .
docker run -p 3000:3000 cissp-study
```

## License

MIT
