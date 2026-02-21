# Database Architecture Reference

**WWBAM Quiz Competition System**
Firebase Realtime Database Schema & Implementation Guide

---

## Overview

Real-time quiz competition system using Firebase Realtime Database. This document provides the schema reference and critical implementation details needed for gameplay development and public display integration.

**Key Principles:**

- Real-time synchronization between host panel and public display
- Questions stored securely in Firebase with access control
- Atomic updates for consistency across nodes
- kebab-case for all Firebase keys

---

## Database Environments

The app uses three separate database instances:

| Environment    | Database Instance             | Access               |
| -------------- | ----------------------------- | -------------------- |
| **Production** | `wwbam-quiz-default-rtdb`     | Live production data |
| **Staging**    | `wwbam-quiz-staging`          | Testing environment  |
| **Local Dev**  | Firebase Emulator (port 9000) | Local development    |

**Environment Detection:**

Environment is determined by the `VITE_ENVIRONMENT` variable loaded via Infisical:

```javascript
// Automatically connects to correct database
VITE_ENVIRONMENT=development  → Firebase Emulator
VITE_ENVIRONMENT=staging      → wwbam-quiz-staging
VITE_ENVIRONMENT=production   → wwbam-quiz-default-rtdb
```

**Database URL Assignment:**

- Set via `VITE_FIREBASE_DATABASE_URL` in Infisical for each environment
- Local dev bypasses this and connects to emulator automatically
- See `src/utils/firebaseEnvironment.js` for implementation

**Rule Deployment:**

```bash
# Deploy to all databases
firebase deploy --only database

# Deploy to specific database
firebase deploy --only database:production
firebase deploy --only database:staging
```

---

## Database Schema

### Root Structure

```
/
├── allowed-hosts/       # Authorized host UIDs
├── question-sets/       # Question sets with correct answers
├── game-state/          # Current session state
├── teams/              # Team data and progress
├── prize-structure/    # Prize values array
└── config/             # Game configuration
```

---

## 1. allowed-hosts Node

**Purpose:** Access control for authorized hosts. Contains UIDs of users permitted to manage the game.

### Schema

Simple object with Firebase Auth UIDs as keys.

### Example

```json
{
  "allowed-hosts": {
    "AbcXYZ123def456GHI": true,
    "JklMNO789pqr012STU": true
  }
}
```

### Security

- Read: Authenticated users only
- Write: Manually via Firebase Console only
- Used in security rules to authorize write operations

---

## 2. question-sets Node

**Purpose:** Stores question sets with full data including correct answers. Access restricted to authorized hosts only.

### Schema

| Field         | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| `set-id`      | string | Unique identifier for the question set |
| `set-name`    | string | Display name of the question set       |
| `questions`   | array  | Array of question objects (exactly 20) |
| `uploaded-at` | number | Server timestamp when set was uploaded |

### Question Object Structure

| Field           | Type   | Description                      |
| --------------- | ------ | -------------------------------- |
| `id`            | string | Unique question identifier       |
| `number`        | number | Question number (1-20)           |
| `text`          | string | Question text                    |
| `options`       | object | Answer options: `{ A, B, C, D }` |
| `correctAnswer` | string | Correct answer key (A/B/C/D)     |
| `difficulty`    | string | Optional: easy/medium/hard       |
| `category`      | string | Optional: question category      |

### Example

```json
{
  "question-sets": {
    "set-1": {
      "set-id": "set-1",
      "set-name": "General Knowledge Set 1",
      "uploaded-at": 1770789376649,
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "text": "What is the capital of France?",
          "options": {
            "A": "London",
            "B": "Paris",
            "C": "Berlin",
            "D": "Rome"
          },
          "correctAnswer": "B",
          "difficulty": "easy",
          "category": "Geography"
        }
        // ... 19 more questions
      ]
    }
  }
}
```

### Security

- Read: Authenticated users who are in `allowed-hosts`
- Write: Authenticated users who are in `allowed-hosts`
- Each set must have exactly 20 questions
- Validation enforced via security rules

---

## 3. game-state Node

**Purpose:** Manages current game session, play queue, and question display state.

### Schema

| Field                       | Type          | Description                                                                       |
| --------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `game-status`               | string        | Game state: `not-started` \| `initialized` \| `active` \| `paused` \| `completed` |
| `current-team-id`           | string\|null  | ID of team currently playing (null when paused/completed)                         |
| `current-question-number`   | number        | Current question (0-20, 0 = not started)                                          |
| `current-question`          | object\|null  | Question data WITHOUT correct answer (for public display)                         |
| `question-visible`          | boolean       | Whether question is shown on public display                                       |
| `options-visible`           | boolean       | Whether answer options are visible (false after 50/50)                            |
| `answer-revealed`           | boolean       | Whether correct answer is highlighted                                             |
| `correct-option`            | string\|null  | Correct answer letter (A/B/C/D) when revealed                                     |
| `selected-option`           | string\|null  | Team's chosen answer (A/B/C/D) when locked, null before reveal                    |
| `option-was-correct`        | boolean\|null | Whether the selected option was correct, null before reveal                       |
| `play-queue`                | array         | Ordered team IDs for gameplay sequence                                            |
| `question-set-assignments`  | object        | Maps team IDs to question set IDs: `{ teamId: setId }`                            |
| `initialized-at`            | number\|null  | Timestamp when game was initialized                                               |
| `started-at`                | number\|null  | Timestamp when first team started playing                                         |
| `last-updated`              | number        | Server timestamp of last update                                                   |
| `active-lifeline`           | string\|null  | Currently active lifeline:`phone-a-friend` \| `fifty-fifty` \| `null`             |
| `lifeline-timer-started-at` | number\|null  | Unix ms timestamp when host started timer; null when not running                  |
| `display-final-results`     | boolean       | When the final results are ready to display                                       |

### Valid Status Transitions

```
not-started → initialized → active ⇄ paused → completed
                                   ↓
                              completed (direct)
```

### Example

```json
{
  "game-state": {
    "game-status": "initialized",
    "current-team-id": null,
    "current-question-number": 0,
    "active-lifeline": null,
    "display-final-results": false,
    "current-question": null,
    "question-visible": false,
    "options-visible": false,
    "answer-revealed": false,
    "correct-option": null,
    "play-queue": ["team-1", "team-2", "team-3"],
    "question-set-assignments": {
      "team-1": "set-1",
      "team-2": "set-2",
      "team-3": "set-3"
    },
    "initialized-at": 1770789376649,
    "started-at": null,
    "last-updated": 1770789376649
  }
}
```

---

## 4. teams Node

**Purpose:** Stores team data, progress, and status for all participating teams.

### Schema

| Field                    | Type         | Description                                                            |
| ------------------------ | ------------ | ---------------------------------------------------------------------- |
| `name`                   | string       | Team display name                                                      |
| `participants`           | string       | Comma-separated participant names                                      |
| `contact`                | string       | Contact phone number                                                   |
| `status`                 | string       | Team state: `waiting` \| `active` \| `eliminated` \| `completed`       |
| `current-prize`          | number       | Accumulated prize money (Rs.)                                          |
| `question-set-id`        | string\|null | Assigned question set ID (from question-sets node)                     |
| `current-question-index` | number       | 0-based index of current question (0-19)                               |
| `questions-answered`     | number       | Count of successfully answered questions                               |
| `lifelines-available`    | object       | Available lifelines: `{ "phone-a-friend": bool, "fifty-fifty": bool }` |
| `created-at`             | number       | Timestamp when team was created                                        |
| `eliminated-at`          | number\|null | Timestamp when eliminated (if applicable)                              |
| `completed-at`           | number\|null | Timestamp when completed all questions                                 |
| `last-updated`           | number       | Server timestamp of last update                                        |

### Valid Status Transitions

```
waiting → active → eliminated (terminal)
               ↓
            completed (terminal)
```

### Example

```json
{
  "teams": {
    "-OlAAtYx9CkcNaNitELz": {
      "name": "Team Alpha",
      "participants": "John Doe, Sarah Smith",
      "contact": "+94 77 123 4567",
      "status": "waiting",
      "current-prize": 0,
      "question-set-id": "set-1",
      "current-question-index": 0,
      "questions-answered": 0,
      "lifelines-available": {
        "phone-a-friend": true,
        "fifty-fifty": true
      },
      "created-at": 1770787936559,
      "eliminated-at": null,
      "completed-at": null,
      "last-updated": 1770787936559
    }
  }
}
```

---

## 5. prize-structure Node

**Purpose:** Defines prize values for each question level.

### Schema

Simple array of numbers (prize values in Rs.). Index 0 = Question 1, Index 19 = Question 20.

### Example

```json
{
  "prize-structure": [
    500,    // Question 1
    1000,   // Question 2
    1500,   // Question 3
    ...
    10000   // Question 20
  ]
}
```

---

## 6. config Node

**Purpose:** Global game configuration settings.

### Schema

| Field                | Type    | Description                       |
| -------------------- | ------- | --------------------------------- |
| `max-teams`          | number  | Maximum teams allowed             |
| `questions-per-team` | number  | Questions per team (typically 20) |
| `timer-enabled`      | boolean | Whether question timer is active  |
| `timer-duration`     | number  | Seconds per question              |
| `lifelines-enabled`  | object  | Which lifelines are available     |
| `display-settings`   | object  | UI preferences for public display |

### Example

```json
{
  "config": {
    "max-teams": 10,
    "questions-per-team": 20,
    "timer-enabled": false,
    "timer-duration": 30,
    "lifelines-enabled": {
      "phone-a-friend": true,
      "fifty-fifty": true,
      "audience-poll": false
    },
    "display-settings": {
      "show-prize-ladder": true,
      "show-team-list": true,
      "animation-duration": 500
    }
  }
}
```

---

## Critical Implementation Details

### Key Naming Convention

- **Firebase (Database):** kebab-case
- **JavaScript (App):** camelCase

```javascript
// Database service handles conversion automatically
await databaseService.updateTeam(teamId, {
  currentPrize: 5000,           // ← camelCase in JS
  currentQuestionIndex: 4,
});

// Stored in Firebase as:
{
  "current-prize": 5000,         // ← kebab-case in DB
  "current-question-index": 4
}
```

### Atomic Multi-Path Updates

Use atomic updates when modifying multiple nodes simultaneously to ensure consistency.

```javascript
// CORRECT: Atomic update across game-state and teams
const updates = {};
updates['game-state/current-team-id'] = 'team-1';
updates['game-state/game-status'] = 'active';
updates['teams/team-1/status'] = 'active';
updates['teams/team-1/last-updated'] = serverTimestamp();

await databaseService.atomicUpdate(updates);

// WRONG: Separate updates (not atomic)
await databaseService.updateGameState({ currentTeamId: 'team-1' });
await databaseService.updateTeam('team-1', { status: 'active' });
```

### Server Timestamps

Always use `serverTimestamp()` for consistency across clients.

```javascript
import { serverTimestamp } from 'firebase/database';

await update(ref(database), {
  'game-state/last-updated': serverTimestamp(),
  'teams/team-1/last-updated': serverTimestamp(),
});
```

### Question Security

Questions are stored in Firebase `question-sets` node with full data including correct answers. Access is restricted to authorized hosts via security rules.

For public display, only question text and options (without correct answer) are pushed to `game-state/current-question`:

```javascript
// Host loads question from Firebase question-sets (includes correct answer)
const question = await databaseService.getQuestionSet(setId);

// Push to game-state for public display (WITHOUT correct answer)
await databaseService.setCurrentQuestion(
  {
    id: 'q5',
    text: 'What is the capital of France?',
    options: { A: 'London', B: 'Paris', C: 'Berlin', D: 'Rome' },
    // correctAnswer omitted
  },
  5,
);
```

**Security Rules:**

```json
{
  "question-sets": {
    ".read": "auth != null && root.child('allowed-hosts').child(auth.uid).exists()",
    ".write": "auth != null && root.child('allowed-hosts').child(auth.uid).exists()"
  }
}
```

### Lifeline Operations

**Key Principles:**

- Lifelines are DECISION TOOLS, not safety nets
- Must be used BEFORE locking answer
- ONE lifeline per question maximum
- Wrong answer after lock = direct elimination (no lifeline rescue)

**Database Operations:**

When lifelines are activated, the system performs atomic updates across multiple nodes:

**50/50 Activation:**

```javascript
{
  "game-state/current-question/options": { A: "...", B: "..." }, // Filtered
  "game-state/active-lifeline": "fifty-fifty",
  "teams/{teamId}/lifelines-available/fiftyFifty": false
}
```

**Phone-a-Friend Activation:**

```javascript
{
  "game-state/active-lifeline": "phone-a-friend",
  "teams/{teamId}/lifelines-available/phoneAFriend": false
}
```

**Clearing Active Lifeline:**

Called after 50/50 completes or Phone-a-Friend call ends:

```javascript
{
  "game-state/active-lifeline": null
}
```

**Service Layer:**

All lifeline operations are handled through `database.service.js`:

- `activateFiftyFiftyLifeline(teamId, filteredOptions)`
- `activatePhoneAFriendLifeline(teamId)`
- `clearActiveLifeline()`

These ensure atomic updates and proper coordination between game-state and team data.

---

## Game Flow & State Transitions

### Initialization Flow

```
1. Host uploads question sets → Firebase question-sets (Route: /questions)
2. Host creates teams → Firebase teams (Route: /teams)
3. Host initializes game → Generates play queue & assignments (Route: /)
4. Atomic update:
   - /game-state/game-status = "initialized"
   - /game-state/play-queue = [shuffled team IDs]
   - /game-state/question-set-assignments = { teamId: setId }
   - /teams/{teamId}/question-set-id = setId (for each team)
```

### Starting Game Flow

```
1. Host clicks "Start Game"
2. Atomic update:
   - /game-state/game-status = "active"
   - /game-state/current-team-id = first team from play-queue
   - /teams/{firstTeamId}/status = "active"
3. Host loads first question from Firebase question-sets
4. Host shows question → push to /game-state/current-question (without answer)
5. Public display renders question in real-time
```

### Question Lifecycle

```
1. Load Question (Host Only)
   - Fetch from Firebase question-sets with correct answer
   - Display to host with all options + correct answer

2. Push to Display (Public Display)
   - Push question WITHOUT correct answer to game-state
   - Set question-visible = true
   - Public display renders question

3. Team Answers
   - Host validates answer locally (against Firebase data)
   - Update team progress in Firebase

4. Reveal Answer
   - Set answer-revealed = true
   - Set correct-option = "A"/"B"/"C"/"D"
   - Public display highlights correct answer
```

### Team Transition Flow

```
1. Current team finishes (eliminated or completed)
2. Update current team status in /teams
3. Get next team from play-queue
4. Atomic update:
   - /game-state/current-team-id = next team
   - /teams/{nextTeamId}/status = "active"
   - /teams/{previousTeamId}/status = "eliminated" or "completed"
5. Reset question state for new team
```

### Firebase Key Naming (Important!)

**All Firebase keys use kebab-case:**

- ✅ `game-status` (not gameStatus)
- ✅ `current-team-id` (not currentTeamId)
- ✅ `question-visible` (not questionVisible)
- ✅ `phone-a-friend` (not phoneAFriend)

**JavaScript code uses camelCase:**

- Application code uses camelCase for variables
- DatabaseService handles automatic conversion between camelCase ↔ kebab-case
- This ensures consistency across database and application code

---

## Question Set JSON Structure (Reference)

For uploading question sets to Firebase:

_Note: Each set must contain exactly `QUESTIONS_PER_SET` questions (defined in `src/constants/config.js`, currently 20)_

```json
{
  "setId": "set-1",
  "setName": "General Knowledge Set 1",
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "text": "What is the capital of France?",
      "options": {
        "A": "London",
        "B": "Paris",
        "C": "Berlin",
        "D": "Rome"
      },
      "correctAnswer": "B",
      "difficulty": "easy",
      "category": "Geography"
    }
    // ... 19 more questions
  ]
}
```
