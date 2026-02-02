# Quiz Competition Host Panel

A real-time quiz competition system inspired by _Who Wants to Be a Millionaire_, designed for multiple teams to compete against questions rather than each other.

## 🚀 Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State Management:** Zustand
- **Database:** Firebase Realtime Database
- **Hosting:** Firebase Hosting
- **Authentication:** Firebase Auth (Email/Password)

## 📋 Prerequisites

- Node.js >= 22.0.0
- pnpm (recommended) or npm
- Firebase account
- Firebase CLI (`npm install -g firebase-tools`)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
pnpm install

# Or using npm
npm install
```

### 2. Firebase Setup

#### A. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Your project is already created: `wwbam-quiz`
3. Enable **Realtime Database**
4. Enable **Authentication** → Email/Password sign-in method
5. Create a host user account in Authentication

#### B. Initialize Firebase Database

Go to Realtime Database in Firebase Console and import this initial structure:

```json
{
  "game-state": {
    "current-team-id": null,
    "current-question-number": 0,
    "current-question": null,
    "question-visible": false,
    "options-visible": false,
    "answer-revealed": false,
    "correct-option": null,
    "game-status": "paused",
    "last-updated": 0
  },
  "teams": {},
  "prize-structure": [
    100, 200, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000,
    500000, 1000000, 2000000, 4000000, 8000000, 16000000, 32000000, 64000000
  ],
  "config": {
    "max-teams": 10,
    "questions-per-team": 20,
    "lifelines-enabled": {
      "phone-a-friend": true,
      "fifty-fifty": true,
      "audience-poll": false
    },
    "display-settings": {
      "show-prize-ladder": true,
      "show-team-list": true,
      "animation-duration": 500
    },
    "timer-enabled": false,
    "timer-duration": 60
  }
}
```

#### C. Deploy Database Rules

```bash
# Login to Firebase
firebase login

# Deploy database security rules
firebase deploy --only database
```

### 3. Environment Variables

Injected by [Infisical](https://app.infisical.com/organizations/08322636-151c-40e3-813a-dd4c7f65f606/projects/secret-management/07b598eb-bde8-47bc-8f6c-c9bedb5b6582/overview)

## 🎯 Development

### Start Development Server

```bash
pnpm dev
# App will open at http://localhost:3000
```

### Test Firebase Integration

1. Start the dev server
2. Visit `http://localhost:3000`
3. You'll see the Firebase Test component
4. Click "Test Read" to verify database connection
5. Login with your host credentials
6. Click "Test Write" to verify write permissions

### Create Host Account

1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password (e.g., `host@example.com`)
4. Use these credentials to login to the host panel

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx      # Auth wrapper for protected routes
│   ├── common/
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ...
│   ├── test/
│   │   └── FirebaseTest.jsx        # Firebase integration test component
│   └── ui/                          # shadcn/ui components
│
├── config/
│   ├── firebase.js                  # Firebase initialization
│   └── routes.js                    # Route configuration
│
├── hooks/
│   ├── useAuth.js                   # Authentication hook
│   └── useTheme.js
│
├── pages/
│   ├── Home.jsx                     # Main page with Firebase test
│   ├── Login.jsx                    # Authentication page
│   └── ...
│
├── services/
│   ├── auth.service.js              # Authentication service
│   └── database.service.js          # Database CRUD operations
│
├── stores/
│   ├── useAuthStore.js              # Auth state management (Zustand)
│   └── useSettingsStore.js
│
└── utils/
    └── ...
```

## 🔐 Security

### Database Rules

The security rules allow:

- ✅ **Read access:** Public (for display screen)
- ✅ **Write access:** Authenticated users only (host panel)

### Authentication

- Email/Password authentication
- Session persistence in localStorage
- Protected routes redirect to login

### Question Security

- Questions stored in browser localStorage (not in Firebase)
- Only question text/options sent to database (no correct answers)
- Host validates answers locally

## 🚀 Deployment

### Deploy to Firebase Hosting

- CICD configured with GitHub actions to deploy the app to the Firebase.
- App will be available at: `https://wwbam-quiz.web.app`

## 📚 Database Architecture

Refer to [Database_Architecture](/docs/DATABASE_ARCHITECTURE.md) for detailed database structure and operations.

### Key Database Paths

- `/game-state` - Current game session state
- `/teams` - All team data
- `/prize-structure` - Prize money array
- `/config` - Game configuration

## 🔧 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build           # Build for production
pnpm preview         # Preview production build
pnpm lint            # Run ESLint
pnpm format          # Format code with Prettier
```

## 🐛 Troubleshooting

### Firebase Connection Issues

1. Check `.env` file exists and has correct values
2. Verify Firebase project is active in console
3. Check browser console for detailed error messages
4. Ensure database rules are deployed

### Authentication Issues

1. Verify Email/Password auth is enabled in Firebase Console
2. Check that host user account exists
3. Clear browser localStorage and try again
4. Check browser console for auth errors

### Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📖 Next Steps

1. ✅ Firebase integration complete
2. 📝 Build question management UI
3. 🎮 Build game control panel
4. 📺 Build public display screen
5. 🎨 Add animations and transitions
