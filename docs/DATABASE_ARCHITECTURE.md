# Quiz Competition System

## Development Documentation

### Firebase Realtime Database Architecture

---

## 1. Project Overview

A real-time quiz competition system inspired by _Who Wants to Be a Millionaire_, designed for multiple teams to compete against questions rather than each other. The system supports live game management with instant updates displayed to all participants.

### Key Features

- 7-10 teams competing in knockout format
- 20 questions per team with progressive prize structure
- Two lifelines: Phone a Friend and 50/50
- Real-time synchronization between host panel and public display
- Unique question sets per team
- All teams can win maximum prize (non-competitive format)

### Game Flow

1. Team takes hot seat and starts from Question 1
2. Prize money increases with each correct answer
3. Team can use lifelines when available
4. Incorrect answer after using all lifelines = elimination
5. Eliminated team receives accumulated prize money
6. Next team begins with fresh question set

---

## 2. Technology Stack

| Component          | Technology                 | Purpose                      |
| ------------------ | -------------------------- | ---------------------------- |
| Database           | Firebase Realtime Database | Real-time data sync          |
| Hosting            | Firebase Hosting           | Static site hosting with CDN |
| Frontend Framework | React 18                   | UI component library         |
| Build Tool         | Vite                       | Fast development server      |
| Styling            | Tailwind CSS               | Utility-first CSS framework  |
| Authentication     | Firebase Auth              | Host panel authentication    |
| Local Storage      | Browser localStorage       | Question bank storage        |

### Why This Stack?

- **Firebase Realtime Database:** WebSocket-based real-time sync with offline support and automatic reconnection
- **Firebase Hosting:** CDN-backed static hosting with zero configuration SSL
- **React + Vite:** Fast development with hot module replacement and optimized builds
- **Tailwind CSS:** Utility-first styling for rapid UI development
- **localStorage:** Client-side storage for question banks (security measure)

---

## 3. Firebase Realtime Database Structure

The database is structured for optimal real-time performance with minimal read/write operations. All paths use kebab-case for consistency.

### 3.1 Root Structure

```json
{
  "game-state": {},
  "teams": {},
  "prize-structure": [],
  "config": {}
}
```

### 3.2 game-state Node

Contains the current state of the active game session. This is the most frequently updated node.

```json
{
  "game-state": {
    "current-team-id": "team-1",
    "current-question-number": 5,
    "current-question": {
      "id": "q5",
      "text": "What is the capital of France?",
      "options": ["A: London", "B: Paris", "C: Berlin", "D: Rome"]
    },
    "question-visible": true,
    "options-visible": true,
    "answer-revealed": false,
    "correct-option": null,
    "game-status": "active",
    "last-updated": 1706745600000
  }
}
```

#### Field Descriptions

| Field                   | Type         | Description                                    |
| ----------------------- | ------------ | ---------------------------------------------- |
| current-team-id         | string       | Team ID currently on hot seat (e.g., 'team-1') |
| current-question-number | number       | Question number (1-20)                         |
| current-question        | object       | Current question data (without correct answer) |
| question-visible        | boolean      | Whether to show question on display            |
| options-visible         | boolean      | Whether to show answer options (for 50/50)     |
| answer-revealed         | boolean      | Whether to highlight correct answer            |
| correct-option          | string\|null | Correct option letter (A/B/C/D) when revealed  |
| game-status             | string       | 'active' \| 'paused' \| 'ended'                |
| last-updated            | number       | Unix timestamp of last update                  |

### 3.3 teams Node

Stores all team data including their progress, lifelines, and status.

```json
{
  "teams": {
    "team-1": {
      "name": "Team Alpha",
      "status": "active",
      "current-prize": 5000,
      "question-set-id": "set-1",
      "current-question-index": 4,
      "lifelines": {
        "phone-a-friend": true,
        "fifty-fifty": true
      },
      "questions-answered": 4,
      "created-at": 1706745000000
    },
    "team-2": {
      "name": "Team Beta",
      "status": "waiting",
      "current-prize": 0,
      "question-set-id": "set-2",
      "current-question-index": 0,
      "lifelines": {
        "phone-a-friend": true,
        "fifty-fifty": true
      },
      "questions-answered": 0,
      "created-at": 1706745100000
    },
    "team-3": {
      "name": "Team Gamma",
      "status": "eliminated",
      "current-prize": 2000,
      "question-set-id": "set-3",
      "current-question-index": 3,
      "lifelines": {
        "phone-a-friend": false,
        "fifty-fifty": false
      },
      "questions-answered": 3,
      "eliminated-at": 1706746000000,
      "created-at": 1706745200000
    }
  }
}
```

#### Team Field Descriptions

| Field                  | Type   | Description                                          |
| ---------------------- | ------ | ---------------------------------------------------- |
| name                   | string | Display name of the team                             |
| status                 | string | 'waiting' \| 'active' \| 'eliminated' \| 'completed' |
| current-prize          | number | Accumulated prize money                              |
| question-set-id        | string | Reference to question set (stored locally)           |
| current-question-index | number | 0-based index of current question (0-19)             |
| lifelines              | object | Available lifelines (true = available)               |
| questions-answered     | number | Number of questions successfully answered            |
| eliminated-at          | number | Timestamp when eliminated (if applicable)            |
| created-at             | number | Timestamp when team was created                      |

#### Team Status Values

- **waiting:** Team has not yet taken hot seat
- **active:** Team currently on hot seat
- **eliminated:** Team answered incorrectly and is out
- **completed:** Team successfully answered all 20 questions

### 3.4 prize-structure Node

Array defining prize values for each question level. Index 0 = Question 1.

```json
{
  "prize-structure": [
    500, // Question 1
    1000, // Question 2
    1500, // Question 3
    2000, // Question 4
    2500, // Question 5 - First Milestone
    3000, // Question 6
    3500, // Question 7
    4000, // Question 8
    4500, // Question 9
    5000, // Question 10 - Second Milestone
    5500, // Question 11
    6000, // Question 12
    6500, // Question 13
    7000, // Question 14
    7500, // Question 15 - Third Milestone
    8000, // Question 16
    8500, // Question 17
    9000, // Question 18
    9500, // Question 19
    10000 // Question 20 - Maximum Prize
  ]
}
```

**Note:** Customize these values to match your prize structure. The array can be any length.

### 3.5 config Node

Global configuration settings for the game.

```json
{
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

#### Config Field Descriptions

| Field              | Type    | Description                             |
| ------------------ | ------- | --------------------------------------- |
| max-teams          | number  | Maximum number of teams allowed         |
| questions-per-team | number  | Number of questions each team answers   |
| lifelines-enabled  | object  | Which lifelines are available           |
| display-settings   | object  | UI display preferences                  |
| timer-enabled      | boolean | Whether to use question timer           |
| timer-duration     | number  | Seconds per question (if timer enabled) |

---

## 4. Firebase Security Rules

Security rules control read/write access to the database. These rules ensure questions remain secure while allowing real-time updates to flow to the public display.

### 4.1 Recommended Rules Configuration

```json
{
  "rules": {
    "game-state": {
      ".read": true,
      ".write": "auth != null"
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

### 4.2 Security Rule Explanation

- **Public Read Access:** All nodes have '.read': true so the public display can show live updates
- **Authenticated Write:** Only authenticated users (host panel) can write data
- **Question Security:** Question banks stored in localStorage, never in Firebase

### 4.3 Authentication Setup

For the host panel to write data, implement Firebase Authentication:

1. Enable Email/Password authentication in Firebase Console
2. Create a host user account
3. Host panel logs in before making any writes

**Alternative:** For a simpler setup during testing, you can temporarily use '.write': true, but **NEVER deploy to production with open write access**.

---

## 5. Data Flow Architecture

### 5.1 Question Data Flow

Questions follow a secure flow that prevents exposure of correct answers:

1. **Preparation:** Host uploads question JSON files to browser localStorage
2. **Team Selection:** Host selects team, loads their question set from localStorage
3. **Question Display:** Host clicks 'Show Question', system pushes question to Firebase WITHOUT correct answer
4. **Public Display:** Display screen listens to Firebase, shows question instantly
5. **Answer Validation:** Host checks answer against localStorage data, updates team status
6. **Answer Reveal:** If revealing answer, host pushes correct option to Firebase

### 5.2 Host Panel Actions â†’ Firebase Updates

| Host Action         | Firebase Updates                                                                |
| ------------------- | ------------------------------------------------------------------------------- |
| Start New Team      | Set current-team-id, reset question number to 1, update team status to 'active' |
| Show Question       | Update current-question object, set question-visible to true                    |
| Use Phone a Friend  | Update team's phone-a-friend to false                                           |
| Use 50/50           | Update team's fifty-fifty to false, filter options in current-question          |
| Mark Correct Answer | Increment current-question-number, update team's current-prize                  |
| Mark Wrong Answer   | Set team status to 'eliminated', save final prize amount                        |
| Reveal Answer       | Set answer-revealed to true, update correct-option field                        |
| End Team Turn       | Set current-team-id to null, game-status to 'paused'                            |

### 5.3 Firebase â†’ Display Screen Updates

The display screen uses Firebase listeners to react to changes:

```javascript
// Display Screen - React to Firebase changes
database.ref('game-state').on('value', (snapshot) => {
  const gameState = snapshot.val();
  // Update UI with new question, options, etc.
});

database.ref('teams').on('value', (snapshot) => {
  const teams = snapshot.val();
  // Update team status, prize money, lifelines
});
```

---

## 6. Implementation Best Practices

### 6.1 Database Operation Guidelines

- **Use .update() instead of .set():** Only update changed fields to minimize data transfer
- **Atomic Updates:** Use multi-path updates to update multiple nodes simultaneously
- **Timestamp Consistency:** Always use firebase.database.ServerValue.TIMESTAMP for server-side timestamps
- **Connection State:** Monitor .info/connected to handle offline scenarios

```javascript
// Good: Atomic multi-path update
const updates = {};
updates['game-state/current-question-number'] = 6;
updates['game-state/question-visible'] = true;
updates['teams/team-1/current-question-index'] = 5;
database.ref().update(updates);

// Good: Server timestamp
updates['game-state/last-updated'] = firebase.database.ServerValue.TIMESTAMP;
```

### 6.2 Error Handling

- **Network Failures:** Implement retry logic with exponential backoff
- **Data Validation:** Validate data before writing to Firebase
- **Offline Mode:** Enable Firebase offline persistence for smoother experience

### 6.3 Performance Optimization

- **Minimize Listener Scope:** Listen to specific paths instead of root
- **Detach Unused Listeners:** Use .off() to remove listeners when components unmount
- **Index Data Appropriately:** Add .indexOn rules for frequently queried fields

---

## 7. Sample Data & Initialization

### 7.1 Initial Database Setup

Go to Realtime Database in Firebase Console and import the initial structure from [here](/public/sample-data/initial-db-structure.json)

### 7.2 Question JSON Format (localStorage)

Store questions in this format in the host panel's localStorage:

```json
{
  "teamId": "team-1",
  "teamName": "Team Alpha",
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "text": "What is the largest planet in our solar system?",
      "options": ["A: Earth", "B: Mars", "C: Jupiter", "D: Saturn"],
      "correctAnswer": "C",
      "difficulty": "easy",
      "category": "Science"
    },
    {
      "id": "q2",
      "number": 2,
      "text": "Who wrote 'Romeo and Juliet'?",
      "options": [
        "A: Charles Dickens",
        "B: William Shakespeare",
        "C: Mark Twain",
        "D: Jane Austen"
      ],
      "correctAnswer": "B",
      "difficulty": "easy",
      "category": "Literature"
    }
    // ... 18 more questions
  ]
}
```

### 7.3 Team Creation Flow

When creating a new team through the host panel:

```javascript
// Create new team in Firebase
const newTeamRef = database.ref('teams').push();
newTeamRef.set({
  name: 'Team Alpha',
  status: 'waiting',
  currentPrize: 0,
  questionSetId: 'set-1',
  currentQuestionIndex: 0,
  lifelines: {
    phoneAFriend: true,
    fiftyFifty: true,
  },
  questionsAnswered: 0,
  createdAt: firebase.database.ServerValue.TIMESTAMP,
});
```

---

## 8. Appendix

### 8.1 Firebase Realtime Database Limits

- **Free Tier:** 1 GB storage, 10 GB/month downloads, 100 simultaneous connections
- **Max Data Size:** 32 MB per write operation
- **Max Depth:** 32 levels of nested data

### 8.2 Useful Firebase Console Paths

- **Database:** https://console.firebase.google.com/project/YOUR_PROJECT/database
- **Rules:** https://console.firebase.google.com/project/YOUR_PROJECT/database/rules
- **Usage:** https://console.firebase.google.com/project/YOUR_PROJECT/usage

### 8.3 Development Checklist

- [ ] Create Firebase project
- [ ] Enable Realtime Database
- [ ] Set up security rules
- [ ] Enable Firebase Authentication
- [ ] Initialize database with sample structure
- [ ] Prepare question JSON files
- [ ] Build host panel with localStorage upload
- [ ] Build public display with Firebase listeners
- [ ] Test real-time sync between panels
- [ ] Deploy to Firebase Hosting

### 8.4 Document Version

- **Version:** 1.0.0
- **Last Updated:** February 2026
- **Status:** Database Structure Specification

---

## Next Steps

With this database structure in place, you can now proceed to:

1. Set up your Firebase project
2. Initialize the database with the sample structure
3. Configure security rules
4. Begin development on the host panel and public display applications

This document serves as the single source of truth for the database architecture throughout the development process.
