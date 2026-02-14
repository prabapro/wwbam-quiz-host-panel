# Database Architecture Reference

**WWBAM Quiz Competition System**
Firebase Realtime Database Schema & Implementation Guide

---

## Overview

Real-time quiz competition system using Firebase Realtime Database. This document provides the schema reference and critical implementation details needed for gameplay development and public display integration.

**Key Principles:**

- Real-time synchronization between host panel and public display
- Questions stored in browser localStorage (not in Firebase)
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
├── game-state/          # Current session state
├── teams/              # Team data and progress
├── prize-structure/    # Prize values array
└── config/             # Game configuration
```

---

## 1. game-state Node

**Purpose:** Manages current game session, play queue, and question display state.

### Schema

| Field                      | Type         | Description                                                                       |
| -------------------------- | ------------ | --------------------------------------------------------------------------------- |
| `game-status`              | string       | Game state: `not-started` \| `initialized` \| `active` \| `paused` \| `completed` |
| `current-team-id`          | string\|null | ID of team currently playing (null when paused/completed)                         |
| `current-question-number`  | number       | Current question (0-20, 0 = not started)                                          |
| `current-question`         | object\|null | Question data WITHOUT correct answer (for public display)                         |
| `question-visible`         | boolean      | Whether question is shown on public display                                       |
| `options-visible`          | boolean      | Whether answer options are visible (false after 50/50)                            |
| `answer-revealed`          | boolean      | Whether correct answer is highlighted                                             |
| `correct-option`           | string\|null | Correct answer letter (A/B/C/D) when revealed                                     |
| `play-queue`               | array        | Ordered team IDs for gameplay sequence                                            |
| `question-set-assignments` | object       | Maps team IDs to question set IDs: `{ teamId: setId }`                            |
| `initialized-at`           | number\|null | Timestamp when game was initialized                                               |
| `started-at`               | number\|null | Timestamp when first team started playing                                         |
| `last-updated`             | number       | Server timestamp of last update                                                   |

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
    "current-question": null,
    "question-visible": false,
    "options-visible": false,
    "answer-revealed": false,
    "correct-option": null,
    "play-queue": ["team-1", "team-2", "team-3"],
    "question-set-assignments": {
      "team-1": "set-alpha",
      "team-2": "set-beta",
      "team-3": "set-gamma"
    },
    "initialized-at": 1770789376649,
    "started-at": null,
    "last-updated": 1770789376649
  }
}
```

---

## 2. teams Node

**Purpose:** Stores team data, progress, and status for all participating teams.

### Schema

| Field                    | Type         | Description                                                            |
| ------------------------ | ------------ | ---------------------------------------------------------------------- |
| `name`                   | string       | Team display name                                                      |
| `participants`           | string       | Comma-separated participant names                                      |
| `contact`                | string       | Contact phone number                                                   |
| `status`                 | string       | Team state: `waiting` \| `active` \| `eliminated` \| `completed`       |
| `current-prize`          | number       | Accumulated prize money (Rs.)                                          |
| `question-set-id`        | string\|null | Assigned question set ID (from localStorage)                           |
| `current-question-index` | number       | 0-based index of current question (0-19)                               |
| `questions-answered`     | number       | Count of successfully answered questions                               |
| `lifelines`              | object       | Available lifelines: `{ "phone-a-friend": bool, "fifty-fifty": bool }` |
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
      "question-set-id": "sample-set-1",
      "current-question-index": 0,
      "questions-answered": 0,
      "lifelines": {
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

## 3. prize-structure Node

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

## 4. config Node

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
    "timer-duration": 60,
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

**Questions are NEVER stored in Firebase.** They remain in browser localStorage on the host panel. Only question text and options (without correct answer) are pushed to Firebase for public display.

```javascript
// Host panel localStorage
const question = {
  id: 'q5',
  text: 'What is the capital of France?',
  options: { A: 'London', B: 'Paris', C: 'Berlin', D: 'Rome' },
  correctAnswer: 'B', // ← NEVER sent to Firebase
};

// Sent to Firebase (public display)
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

---

## Game Flow & State Transitions

### Initialization Flow

```
1. Host uploads question sets → localStorage (Route: /questions)
2. Host creates teams → Firebase (Route: /teams)
3. Host initializes game → Generates play queue & assignments (Route: /)
4. Atomic update:
   - /game-state/game-status = "initialized"
   - /game-state/play-queue = [shuffled team IDs]
   - /game-state/question-set-assignments = { teamId: setId }
   - /teams/{teamId}/question-set-id = setId (for each team)
```

### Starting Event Flow

```
1. Host clicks "Start Event"
2. Atomic update:
   - /game-state/game-status = "active"
   - /game-state/current-team-id = first team from play-queue
   - /teams/{firstTeamId}/status = "active"
3. Host loads first question from localStorage
4. Host shows question → push to /game-state/current-question
5. Public display renders question in real-time
```

### Question Lifecycle

```
1. Load Question (Host Only)
   - Fetch from localStorage with correct answer
   - Display to host with all options + correct answer

2. Push to Display (Public Display)
   - Push question WITHOUT correct answer to Firebase
   - Set question-visible = true
   - Public display renders question

3. Team Answers
   - Host validates answer locally (against localStorage)
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
   - /game-state/current-team-id = next team ID
   - /game-state/current-question-number = 0
   - /teams/{nextTeamId}/status = "active"
   - Clear current question state
```

---

## Security Rules

```json
{
  "rules": {
    "game-state": {
      ".read": true, // Public read for display screen
      ".write": "auth != null" // Only authenticated host can write
    },
    "teams": {
      ".read": true,
      ".write": "auth != null"
    },
    "prize-structure": {
      ".read": true,
      ".write": "auth != null"
    },
    "config": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

**Rationale:**

- Public read access enables real-time public display updates
- Write access restricted to authenticated host panel
- Questions never in Firebase = no exposure risk

---

## Quick Reference

### Common Update Patterns

```javascript
// Update single field
await databaseService.updateGameState({ gameStatus: 'active' });

// Update team
await databaseService.updateTeam('team-1', { currentPrize: 5000 });

// Atomic multi-path update
const updates = {};
updates['game-state/game-status'] = 'active';
updates['teams/team-1/status'] = 'active';
await databaseService.atomicUpdate(updates);

// Set current question (no correct answer)
await databaseService.setCurrentQuestion(questionData, questionNumber);

// Reveal answer
await databaseService.revealAnswer('B');

// Use lifeline
await databaseService.useLifeline('team-1', 'fifty-fifty');

// Eliminate team
await databaseService.eliminateTeam('team-1');
```

### Database Paths

| Path                                   | Purpose                     |
| -------------------------------------- | --------------------------- |
| `/game-state`                          | Current session state       |
| `/game-state/play-queue`               | Team play order             |
| `/game-state/question-set-assignments` | Team → question set mapping |
| `/teams/{teamId}`                      | Individual team data        |
| `/teams/{teamId}/lifelines`            | Team lifeline status        |
| `/prize-structure`                     | Prize values array          |
| `/config`                              | Global settings             |

### Real-time Listeners

```javascript
// Listen to game state changes (public display)
const unsubscribe = databaseService.onGameStateChange((gameState) => {
  // Update display with new game state
});

// Listen to teams changes (team list updates)
const unsubscribe = databaseService.onTeamsChange((teams) => {
  // Update team list display
});

// Clean up listeners
unsubscribe();
```

---

## Future Development Notes

### For Gameplay Features:

- Implement timer logic using `game-state/timer-started-at` and `config/timer-duration`
- Add audience poll lifeline support in `teams/{teamId}/lifelines`
- Consider adding `game-state/paused-at` for pause/resume tracking

### For Public Display App:

- Subscribe to `game-state` for question updates
- Subscribe to `teams` for team status/prize updates
- Subscribe to `prize-structure` for ladder display
- Implement UI animations based on `config/display-settings/animation-duration`
- Handle network disconnections gracefully (Firebase offline persistence)

### Performance Considerations:

- Use `.indexOn` rules for frequently queried fields
- Limit listener scope to specific paths (avoid listening to root)
- Implement connection state monitoring for offline handling
- Consider pagination for team lists if exceeding 20 teams

---

**Document Version:** 2.1.0
**Last Updated:** February 2026
**Status:** Production Reference
