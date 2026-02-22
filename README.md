# WWBAM Quiz Competition - Host Panel

Real-time quiz competition system with multi-team gameplay with Firebase backend.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (with Infisical for env vars)
pnpm dev

# App opens at http://localhost:3000
```

### Tech Stack

- React 19 + Vite + Tailwind CSS 4
- Zustand (state management)
- Firebase Realtime Database + Auth

### Prerequisites

- Node.js >= 22.0.0
- pnpm
- Firebase project: `wwbam-quiz`
- Infisical CLI (environment variables)

### Database Rules

The app uses three database instances:

- **Production**: `wwbam-quiz-default-rtdb` (live data)
- **Staging**: `wwbam-quiz-staging` (testing)
- **Local Dev**: Firebase Emulator (port 9000)

Deploy rules after changes:

```bash
firebase login

# Deploy to all databases (production + staging)
firebase deploy --only database

# Deploy to specific database
firebase deploy --only database:production
firebase deploy --only database:staging
```

**Rules:** Public read, authenticated write only.

### Host Authentication

#### Staging/Production

Create host account in Firebase Console → Authentication:

- Email: `host@example.com`
- Password: (set securely)

#### Local Development

Create host account in Firebase Emulator

## Configuration

All game-specific settings are in `src/constants/config.js`:

```javascript
QUESTIONS_PER_SET = 20        // Questions per team
MIN_TEAMS = 1                 // Minimum teams required
IDEAL_MIN_TEAMS = 7           // Recommended minimum
MAX_TEAMS = 10                // Maximum teams allowed
MILESTONE_QUESTIONS = [5, 10, 15, 20]
LIFELINE_TYPES = { ... }
```

Edit this file to adjust game parameters before running the app.

### Environment Variable Overrides

Both `QUESTIONS_PER_SET` and `MAX_TEAMS` can be overridden at runtime via environment variables — no code changes needed.

| Variable                 | Default | Description                     |
| ------------------------ | ------- | ------------------------------- |
| `VITE_QUESTIONS_PER_SET` | `20`    | Number of questions per team    |
| `VITE_MAX_TEAMS`         | `10`    | Maximum number of teams allowed |

#### Shorthand Dev Scripts

```bash
pnpm dev        # Default (10 teams, 10 question sets, 20 questions per set)
pnpm dev:q      # VITE_QUESTIONS_PER_SET=5  (10 teams, 10 question sets, 5 questions per set)
pnpm dev:t      # VITE_MAX_TEAMS=3          (3 teams,  3 question sets,  20 questions per set)
pnpm dev:qt     # Both overrides            (3 teams,  3 question sets,  5 questions per set)
```

#### Manual Override

```bash
VITE_QUESTIONS_PER_SET=10 pnpm dev
VITE_MAX_TEAMS=5 pnpm dev
VITE_QUESTIONS_PER_SET=10 VITE_MAX_TEAMS=5 pnpm dev
```

**Behavior:**

- `VITE_QUESTIONS_PER_SET` — uploaded question sets must have at least this many questions; only the first N are saved and used in the game.
- `VITE_MAX_TEAMS` — enforced during team upload/validation and when loading sample data (both teams and question sets are capped to this number).

---

## Testing Guide

### Sample Files

All sample data files are in `/public/sample-data/`:

- `sample-question-sets.zip` - 4 complete question sets (20 questions each)
- `sample-teams.json` - 10 example teams
- `initial-db-structure.json` - Firebase initial setup

**Basic Test Flow:**

1. Login with host credentials
2. Upload question sets from zip file
3. Upload teams JSON or create manually
4. Verify setup → Initialize game

---

## Development Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm deploy:firebase  # Build + deploy to Firebase
```

---

## Troubleshooting

**"Initialize Game" button disabled**

- Check Setup Verification component for failing validation checks
- Ensure sufficient question sets for teams (1:1 ratio)

**MissingQuestionSetsAlert appears**

- Upload required question sets shown in alert
- Set IDs must match exactly (case-sensitive)

**Firebase connection errors**

- Verify Infisical env vars loaded
- Check Firebase Console for project status
- Redeploy database rules: `firebase deploy --only database`

**Question set upload fails**

- Must have at least `QUESTIONS_PER_SET` questions (default: 20)
- Validate JSON structure against sample files
- Extra questions beyond `QUESTIONS_PER_SET` are automatically trimmed

**Firebase Emulator Port-in-use**

> ⚠ database: Port 9000 is not open on localhost (127.0.0.1,::1), could not start Database Emulator.

- Run `lsof -i 9000`
- Get the PID(s) - ie: `50810`
- Run `kill -9 <PID>` - ie: `kill -9 50810`

---

## Documentation

- **Database Schema:** [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md)
- **User Journey:** [docs/USER_JOURNEY.md](docs/USER_JOURNEY.md)
- **PRD Phases:** [docs/PRD/](docs/PRD/)
