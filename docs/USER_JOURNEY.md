# User Journey - Quiz Host Panel

## Overview

This document outlines the complete user journey for the quiz competition host panel, including pre-event setup, game management, and post-event procedures.

---

## Journey 1: Pre-Event Setup (Before Event Day)

### Step 1: Authentication

- Host visits the panel URL
- Sees login page
- Enters email/password
- Successfully logs in → redirected to Dashboard

### Step 2: Question Bank Upload

- Host navigates to "Question Management" section
- Clicks "Upload Question Set"
- Selects JSON file from computer (or drags & drops)
- System validates the JSON structure:
  - Each set must have exactly `QUESTIONS_PER_SET` questions (defined in `src/constants/config.js`, currently 20)
  - Each question must have: text, 4 options (A/B/C/D), correct answer
- Question set stored in Firebase question-sets node with unique ID
- Host sees confirmation: "Question Set 1 uploaded (20 questions)"
- Host repeats for all required sets (e.g., uploads 7-10 question sets)

**Question Sets List View:**

```
📁 Question Set 1 (20 questions) - Ready ✅
📁 Question Set 2 (20 questions) - Ready ✅
📁 Question Set 3 (20 questions) - Ready ✅
...
```

_Note: Each set must contain exactly `QUESTIONS_PER_SET` questions as defined in `src/constants/config.js`_

### Step 3: Team Configuration (Pre-Event)

- Host navigates to "Team Configuration" section
- Clicks "Add Team" button
- Dialog opens with form:
  - **Team Name**: [input field] - e.g., "Team Alpha"
  - **Participant Names**: [textarea] - e.g., "John, Sarah, Mike"
  - **Contact**: [input] - Optional phone/email
- Host fills in details and clicks "Save"
- System:
  - Creates team in Firebase with `status: "waiting"`
  - Team card appears in configuration list
- Host repeats for all teams (7-10 teams)

**Team Configuration List:**

```
Team Alpha       | Participants: John, Sarah, Mike    | Status: Configured ✅
Team Beta        | Participants: Lisa, Tom, Emma      | Status: Configured ✅
Team Gamma       | Participants: Alex, Chris, Jordan  | Status: Configured ✅
...
```

### Step 4: Verify Setup

- Dashboard automatically validates setup in real-time with **Setup Verification** component
- Host reviews validation status with grouped checks:

**Teams Validation:**

- ✅ Teams Configured: 7 teams ready
- ✅ Team Data Valid: All teams have valid data
- ✅ Ideal Team Count: 7 teams (recommended: 3-10)

**Question Sets Validation:**

- ✅ Question Sets Uploaded: 7 sets uploaded
- ✅ Question Structure Valid: All sets have 20 questions
- ✅ Sufficient Sets: 7 sets available for 7 teams

**Prize Structure:**

- ✅ Prize Structure Configured: QUESTIONS_PER_SET prize levels (Rs.500 - Rs.10,000)

- All validation checks pass → **"Initialize Game"** button becomes enabled
- System shows: "Setup Complete - Ready to Initialize! 🎯"

---

## Journey 2: Event Day - Game Initialization

### Step 1: Pre-Initialization Check

- Host arrives on event day
- Logs into the panel
- Dashboard shows:
  - All teams with `status: "waiting"`
  - Question sets loaded to Firebase
  - Game Status: `game-status: "not-started"`
  - Setup Verification: All checks passing ✅
  - **"Initialize Game"** button enabled

### Step 2: Initialize Game Modal

- Host clicks **"Initialize Game"** button
- **Initialize Game Modal** opens showing **Preview Stage**:

**Modal Content:**

```
┌─────────────────────────────────────────┐
│ 🎲 Initialize Game                      │
│                                         │
│ ⚠️ Random Assignment Warning            │
│ Question sets will be randomly assigned │
│ to teams and saved to Firebase.         │
│                                         │
│ Teams (7):                              │
│ ┌─────────────────────────────────────┐ │
│ │ • team-1  Team Alpha                │ │
│ │ • team-2  Team Beta                 │ │
│ │ • team-3  Team Gamma                │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Question Sets (7):                      │
│ ┌─────────────────────────────────────┐ │
│ │ • set-1  Question Set 1             │ │
│ │ • set-2  Question Set 2             │ │
│ │ • set-3  Question Set 3             │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│         [Cancel]  [Initialize Game]     │
└─────────────────────────────────────────┘
```

### Step 3: Processing Stage

- Host clicks **"Initialize Game"** button in modal
- Modal switches to **Processing Stage**:

```
┌─────────────────────────────────────────┐
│ Initializing Game...                    │
│                                         │
│          [Loading Spinner]              │
│                                         │
│   🎲 Shuffling teams...                 │
│   🎯 Assigning question sets...         │
│   💾 Syncing to Firebase...             │
│                                         │
└─────────────────────────────────────────┘
```

- System performs automatic setup:
  1. **Shuffles team order** randomly using Fisher-Yates algorithm
  2. **Assigns question sets** randomly to each team (1:1 mapping)
  3. **Creates play queue** (array of shuffled team IDs)
  4. **Updates Firebase** with atomic multi-path update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/game-status": "initialized",
  "game-state/play-queue": ["team-3", "team-1", "team-5", ...],
  "game-state/question-set-assignments": {
    "team-1": "set-2",
    "team-3": "set-5",
    "team-5": "set-7",
    ...
  },
  "game-state/initialized-at": serverTimestamp(),
  "game-state/last-updated": serverTimestamp(),

  // Update each team's question set assignment
  "teams/team-1/question-set-id": "set-2",
  "teams/team-1/last-updated": serverTimestamp(),
  "teams/team-3/question-set-id": "set-5",
  "teams/team-3/last-updated": serverTimestamp(),
  ...
}
```

### Step 4: Results Stage

- Modal switches to **Results Stage**:

```
┌─────────────────────────────────────────┐
│ ✅ Game Initialized Successfully!       │
│                                         │
│ 🎲 Play Queue Preview                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Team Gamma → Question Set 5      │ │
│ │    Participants: Alex, Chris, Jordan│ │
│ │                                     │ │
│ │ 2. Team Alpha → Question Set 2      │ │
│ │    Participants: John, Sarah, Mike  │ │
│ │                                     │ │
│ │ 3. Team Epsilon → Question Set 7    │ │
│ │    Participants: Lisa, Tom, Emma    │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│            [Go to Dashboard]            │
└─────────────────────────────────────────┘
```

- Host clicks **"Go to Dashboard"** to return
- Dashboard updates to show:
  - Game Status: `game-status: "initialized"`
  - Play queue visible
  - Each team card shows assigned question set
  - **"Start Game"** button appears (replacing "Initialize Game")

### Step 5: Start Game

- Host clicks **"Start Game"** button on Game Control Panel
- **Start Game Confirmation Dialog** opens:

**Dialog Content:**

```
┌─────────────────────────────────────────┐
│ Start Game?                              │
│                                          │
│ The first team will be activated and     │
│ the game will begin. Make sure you're    │
│ ready!                                   │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 👥 First Team                       │  │
│ │                                     │  │
│ │ Team Name: Team Gamma               │  │
│ │ Participants: Alex, Chris, Jordan   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📝 Question Set                     │  │
│ │                                     │  │
│ │ Set Name: Question Set 5            │  │
│ │ Questions: 20                       │  │
│ └────────────────────────────────────┘  │
│                                          │
│         [Cancel]  [Start Game]           │
└─────────────────────────────────────────┘
```

- Host reviews first team and question set details
- Host clicks **"Start Game"** button to confirm
- System performs:
  1. **Load question set** from Firebase question-sets (first team's assigned set via `loadQuestionSet()`)
  2. **Atomic Firebase update**:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/game-status": "active",
  "game-state/current-team-id": "team-3",  // First from play queue
  "game-state/current-question-number": 0,
  "game-state/started-at": serverTimestamp(),
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/status": "active",
  "teams/team-3/last-updated": serverTimestamp()
}
```

3. **Show success toast**: "Game Started! Team Gamma is now on the hot seat. Good luck!"
4. **Navigate to /play**: Host panel transitions to gameplay interface

- Public display shows: "Welcome Team Gamma!"
- Dashboard highlights active team (Team Gamma)
- Question control panel becomes active on `/play` page

---

## Journey 3: Active Game Play (Team by Team)

### Phase A: Team's Turn Begins (Automatic)

**System State:**

- Current Team: Team Gamma (auto-selected from play queue)
- Question Set: Set 5 (auto-assigned during initialization)
- Question Number: 0/QUESTIONS_PER_SET
- Status Bar shows: "🎮 Team Gamma | Question 0/QUESTIONS_PER_SET | Prize: Rs.0"

### Phase B: Question Cycle (Repeat up to QUESTIONS_PER_SET times or until elimination)

#### Step 1: Load Next Question

- Host clicks **"Load Question"** button
- System:
  - Fetches next question from Firebase question-sets (Question 1 from Set 5)
  - Loads question data INCLUDING correct answer key
  - Shows question to **HOST ONLY**:
    ```
    Question 1: What is the capital of France?
    A: London
    B: Paris ✓ (correct answer - shown only to host)
    C: Berlin
    D: Rome
    ```
  - Host panel shows: "Question loaded - Ready to display"
  - **"Push to Display"** button becomes enabled

#### Step 2: Display Question to Public

- Host clicks **"Push to Display"** button
- System:
  - Pushes question to Firebase **WITHOUT correct answer**:

```javascript
// Firebase update (kebab-case keys)
{
  "game-state/current-question": {
    "id": "q1",
    "text": "What is the capital of France?",
    "options": {
      "A": "London",
      "B": "Paris",
      "C": "Berlin",
      "D": "Rome"
    }
    // NO correctAnswer field
  },
  "game-state/question-visible": true,
  "game-state/options-visible": true,
  "game-state/current-question-number": 1,
  "game-state/last-updated": serverTimestamp()
}
```

- Public display screen shows the question in real-time
- Host panel shows: "⏳ Waiting for team's answer..."

#### Step 3: Team Selects Answer

- Team discusses and decides on their answer (verbally)
- Team announces: "We'd like to go with B"
- Host clicks the **"B"** button on the answer pad
- System:
  - Highlights B button in yellow (local state only, not synced to Firebase)
  - Shows: "Team selected: B"
  - **"Lock Answer"** button becomes enabled

**Answer Pad UI:**

```
┌─────────────────────────────────────┐
│   Select Team's Answer:             │
│                                     │
│   [ A ]  [ B ]  [ C ]  [ D ]        │
│                 ↑                   │
│            (highlighted)            │
│                                     │
│   [🔒 Lock Answer] ← enabled        │
└─────────────────────────────────────┘
```

#### Step 4A: Lock Answer - Correct (Automatic Validation)

- Host clicks **"Lock Answer"** button
- System performs automatic validation:
  1. Compares selected answer (B) with correct answer from Firebase question-sets (B)
  2. Result: ✅ CORRECT

**If Correct:**

- System automatically performs atomic Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/answer-revealed": true,
  "game-state/correct-option": "B",
  "game-state/current-question-number": 2,  // Increment
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/current-prize": 500,  // From prize-structure[0]
  "teams/team-3/questions-answered": 1,
  "teams/team-3/current-question-index": 1,
  "teams/team-3/last-updated": serverTimestamp()
}
```

- Public display receives real-time update:
  - Shows green checkmark ✅
  - Highlights B in green
  - Shows confetti animation
  - Displays new prize: "Rs.500"
- Prize ladder advances to level 1
- Team card updates: "Progress: 1/20 | Prize: Rs.500"
- Host panel shows: "✅ Correct Answer! Team wins Rs.500"
- **"Next Question"** button appears
- Host clicks "Next Question" → Returns to Step 1

#### Step 4B: Lock Answer - Wrong Answer (Automatic Validation)

- Host clicks **"Lock Answer"** button
- System performs automatic validation:
  1. Compares selected answer (C) with correct answer from Firebase question-sets (B)
  2. Result: ❌ INCORRECT

**System checks lifeline status:**

**Scenario 1: Wrong answer after lock = Direct elimination**

- System automatically performs atomic Firebase update (NO lifeline checking):

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/answer-revealed": true,
  "game-state/correct-option": "B",
  "game-state/active-lifeline": null, // Clear any active lifeline
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/status": "eliminated",
  "teams/team-3/eliminated-at": serverTimestamp(),
  "teams/team-3/last-updated": serverTimestamp()
  // current-prize stays at last correct value
}
```

- Public display receives update:
  - Shows X animation
  - Reveals correct answer (B highlighted in green)
  - Shows: "The correct answer was B: Paris"
- Team's final prize frozen at last correct answer amount
- Host panel shows: "Team Gamma eliminated - Final Prize: Rs.1,000"
- Team card turns red with "Eliminated" badge
- **"Next Team"** button appears

**Note:** Lifelines cannot save a team after answer is locked. They must be used BEFORE selecting an answer (see Step 5).

- If **"Offer Lifeline"** clicked → Go to Step 5 (Lifeline Flow)
- If **"Eliminate Team"** clicked → Continue to Scenario 2 below

**Scenario 2: Team has NO unused lifelines (or host chooses elimination)**

- System automatically performs atomic Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/answer-revealed": true,
  "game-state/correct-option": "B",
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/status": "eliminated",
  "teams/team-3/eliminated-at": serverTimestamp(),
  "teams/team-3/last-updated": serverTimestamp()
  // current-prize stays at last correct value
}
```

- Public display receives update:
  - Shows X animation
  - Reveals correct answer (B highlighted in green)
  - Shows: "The correct answer was B: Paris"
- Team's final prize frozen at last correct answer amount
- Host panel shows: "Team Gamma eliminated - Final Prize: Rs.1,000"
- Team card turns red with "Eliminated" badge
- **"Next Team"** button appears
- Host clicks "Next Team" → Go to Phase C

#### Step 5: Lifeline Usage (BEFORE Selecting Answer)

**RULE:** Lifelines must be used BEFORE selecting an answer. Once answer is locked, wrong answer = elimination (no lifeline rescue).

**Timing:**

- Question displayed to public
- Team discusses options
- **[DECISION POINT]** Team can use ONE lifeline now
- After lifeline use (or skip), team selects answer
- Host locks answer (validation occurs)

**One Per Question Rule:**

- Team can use either Phone-a-Friend OR 50/50
- Not both in the same question
- Once used, both buttons become disabled for this question

---

**Phone-a-Friend Flow:**

1. Team says: "We'd like to use Phone-a-Friend"
2. Host clicks **"📞 Phone-a-Friend"** button
3. System performs atomic Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/active-lifeline": "phone-a-friend",
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/lifelines-available/phoneAFriend": false,
  "teams/team-3/last-updated": serverTimestamp()
}
```

4. Both lifeline buttons become disabled (one-per-question rule)
5. Host panel shows: "📞 Phone-a-Friend Active - Timer paused"
6. Public display shows: "Phone-a-Friend in use"
7. Team makes phone call (3 minutes max)
8. Host clicks **"Resume"** button after call completes
9. System clears active lifeline:

```javascript
{
  "game-state/active-lifeline": null,
  "game-state/last-updated": serverTimestamp()
}
```

10. Returns to Step 3 (Team selects answer from all options)

---

**50/50 Flow:**

1. Team says: "We'd like to use 50/50"
2. Host clicks **"✂️ 50/50"** button
3. System automatically:
   - Applies 50/50 logic (removes 2 incorrect answers)
   - Performs atomic Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/current-question/options": {
    "A": "London",
    "B": "Paris"
    // C and D removed
  },
  "game-state/active-lifeline": "fifty-fifty",
  "game-state/last-updated": serverTimestamp(),
  "teams/team-3/lifelines-available/fiftyFifty": false,
  "teams/team-3/last-updated": serverTimestamp()
}
```

4. Both lifeline buttons become disabled (one-per-question rule)
5. Public display updates to show only 2 options
6. System auto-clears active lifeline after 1 second:

```javascript
{
  "game-state/active-lifeline": null
}
```

7. Returns to Step 3 (Team selects answer from 2 remaining options)

---

**Key Points:**

- Lifelines are DECISION TOOLS, not safety nets
- Use BEFORE selecting answer, not after wrong answer
- Once answer is locked, no lifeline can save the team
- One lifeline maximum per question

#### Step 6: Complete Team's Turn

**Scenario A: Team completes all QUESTIONS_PER_SET questions ✅**

- After final question answered correctly
- System performs final Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "teams/team-3/status": "completed",
  "teams/team-3/current-prize": 10000,  // Max prize from structure
  "teams/team-3/completed-at": serverTimestamp(),
  "teams/team-3/last-updated": serverTimestamp()
}
```

- Public display shows: "🎉 Congratulations Team Gamma - Rs.10,000!"
- Team card turns green with "WINNER 🏆" badge
- **"Next Team"** button appears

**Scenario B: Team eliminated ❌**

- Already handled in Step 4B Scenario 2

### Phase C: Transition to Next Team (Automatic)

#### Step 7: Load Next Team from Queue

- Host clicks **"Next Team"** button
- System automatically:
  1. Clears current question display
  2. Resets local question state
  3. Gets next team from play queue
  4. Performs atomic Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "game-state/current-team-id": "team-1",  // Next from queue
  "game-state/current-question-number": 0,
  "game-state/current-question": null,
  "game-state/question-visible": false,
  "game-state/options-visible": false,
  "game-state/answer-revealed": false,
  "game-state/correct-option": null,
  "game-state/last-updated": serverTimestamp(),
  "teams/team-1/status": "active",
  "teams/team-1/last-updated": serverTimestamp()
}
```

- Public display shows: "Next up: Team Alpha!"
- Dashboard highlights new active team (Team Alpha)
- Host loads Team Alpha's assigned question set (Set 2) from Firebase question-sets
- Question counter resets to 0
- Returns to Phase B, Step 1 (Load Next Question)

---

## Journey 4: Game Management & Monitoring

### Real-Time Dashboard View

**Status Bar (Top):**

```
🎮 ACTIVE: Team Gamma | Question 5/QUESTIONS_PER_SET | Prize: Rs.2,500 | ⏱️ 00:45
```

**Main Panels:**

1. **Question Control Panel** (Left)

   - Current question display (host view with correct answer indicator)
   - Answer pad (A/B/C/D buttons)
   - Lock Answer button
   - Lifeline buttons (Phone-a-Friend, 50/50)
   - Load Question / Push to Display / Next Question buttons

2. **Team Status Panel** (Center)

   - Grid of all team cards
   - Color-coded statuses:
     - 🟦 Blue: `status: "active"` (currently playing)
     - ⚪ Grey: `status: "waiting"` (in queue)
     - 🟢 Green: `status: "completed"` (finished all questions)
     - 🔴 Red: `status: "eliminated"` (wrong answer)
   - Each card shows:
     - Team name
     - Progress (X/QUESTIONS_PER_SET)
     - Current prize (Rs.)
     - Lifelines status
     - Assigned question set ID

3. **Prize Ladder** (Right)
   - Visual ladder from Rs.500 to Rs.10,000
   - Current level highlighted
   - Milestone markers at every 5th level

**Control Button States:**

```
Game Not Started (game-status: "not-started"):
  ✅ Initialize Game
  ❌ All other buttons disabled

Game Initialized (game-status: "initialized"):
  ✅ Start Game (with confirmation dialog)
  ❌ Question controls disabled

Active Game, No Active Team (game-status: "active", current-team-id: null):
  ✅ Select First Team
  ❌ Question controls disabled

Active Team, No Question Loaded:
  ✅ Load Question
  ❌ Push to Display disabled
  ❌ Answer controls disabled

Question Loaded (Host View Only):
  ✅ Push to Display
  ✅ Lifelines (if available)
  ❌ Answer pad disabled
  ❌ Lock Answer disabled

Question Displayed to Public (question-visible: true):
  ❌ Push to Display disabled
  ✅ Answer pad (A/B/C/D) enabled
  ✅ Lifelines (if team has unused ones)
  ❌ Lock Answer disabled (until team selects)

Team Answer Selected (local state):
  ✅ Lock Answer enabled
  ✅ Change answer (can click different option)
  ✅ Lifelines (if available)

Answer Locked & Validated:
  ❌ All answer controls disabled
  ✅ Next Question (if correct)
  ✅ Offer Lifeline / Eliminate (if incorrect + lifelines available)
  ✅ Next Team (if team completed/eliminated)
```

---

## Journey 5: Edge Cases & Special Scenarios

### Scenario A: Team Walks Away (Optional Rule)

- Team decides to quit with current prize
- Host clicks **"Walk Away"** button
- Dialog: "Confirm Team Gamma walks away with Rs.2,500?"
- Host confirms
- System performs Firebase update:

```javascript
// Firebase updates (kebab-case keys)
{
  "teams/team-3/status": "completed",
  "teams/team-3/completed-at": serverTimestamp(),
  "teams/team-3/last-updated": serverTimestamp()
  // current-prize remains unchanged
}
```

- Team card shows "Walked Away - Won Rs.2,500"
- **"Next Team"** button appears

### Scenario B: Technical Issue / Need to Pause

- Host clicks **"⏸️ Pause Game"** button
- System performs Firebase update:

```javascript
// Firebase update (kebab-case keys)
{
  "game-state/game-status": "paused",
  "game-state/last-updated": serverTimestamp()
}
```

- Public display shows "Game Paused" overlay
- All controls disabled except "Resume"
- Host resolves issue
- Clicks **"▶️ Resume Game"** button
- System updates:

```javascript
// Firebase update (kebab-case keys)
{
  "game-state/game-status": "active",
  "game-state/last-updated": serverTimestamp()
}
```

- Everything continues from where it stopped

### Scenario C: Question Error / Skip Question

- Host realizes question has an error (typo, wrong options, etc.)
- Clicks **"⏭️ Skip Question"** button
- Dialog: "Skip this question? Team will move to next question with no penalty."
- Host confirms
- System:
  - Moves to next question without prize change
  - Logs skipped question (in browser console only)
  - No Firebase update for prize
  - Question counter still increments (Q5 → Q6)

### Scenario D: Answer Already Visible, Need to Retract

- Host accidentally clicked "Push to Display" too early
- Clicks **"🔙 Hide Question"** button
- System performs Firebase update:

```javascript
// Firebase update (kebab-case keys)
{
  "game-state/question-visible": false,
  "game-state/last-updated": serverTimestamp()
}
```

- Public display clears question
- Returns to "Question Loaded" state
- Can Push to Display again when ready

### Scenario E: Wrong Answer Selected by Mistake

- Host clicked wrong button (e.g., clicked C when team said B)
- Host has NOT clicked "Lock Answer" yet
- Simply click the correct button (B)
- System updates selection locally (no Firebase sync)
- Previous selection automatically deselected
- No confirmation needed until "Lock Answer" is clicked

### Scenario F: Connection Loss

- Firebase connection drops
- System:
  - Shows red "🔴 Connection Lost" banner
  - Attempts automatic reconnection
  - Buffers any changes made offline (Firebase SDK handles this)
  - When reconnected: syncs all buffered changes
  - Shows "✅ Connected" confirmation
- Public display continues showing last synced state
- Firebase SDK ensures data consistency on reconnection

---

## Journey 6: Post-Game / End of Event

### Final Steps

#### Step 1: All Teams Completed

- Last team finishes (completed or eliminated)
- System automatically updates:

```javascript
// Firebase update (kebab-case keys)
{
  "game-state/game-status": "completed",
  "game-state/current-team-id": null,
  "game-state/last-updated": serverTimestamp()
}
```

- Dashboard generates final standings

#### Step 2: View Final Results

- Dashboard shows summary view:

  ```
  📊 Event Complete - Final Standings

  🏆 Winners (Rs.10,000):
  - Team Alpha
  - Team Gamma

  💰 Prize Winners:
  - Team Beta: Rs.5,000 (Eliminated at Q12)
  - Team Delta: Rs.2,500 (Eliminated at Q8)
  - Team Epsilon: Rs.500 (Eliminated at Q3)

  ❌ Eliminated Early (Q1-Q2):
  - Team Zeta: Rs.0

  Total Prize Money Distributed: Rs.28,000
  ```

#### Step 3: Export Results (Optional)

- Host clicks **"📥 Export Results"** button
- System generates CSV/JSON file with:
  - Team names & participants
  - Questions answered
  - Final prizes
  - Lifelines used
  - Timestamps (initialized-at, eliminated-at, completed-at)
  - Question set IDs
- File downloads to host's computer

#### Step 4: Public Display End Screen

- Host clicks **"Show Final Results"** button
- Public display shows:
  - Winner announcement with animations
  - All team standings table
  - Total prize money distributed
  - Thank you message

#### Step 5: Event Cleanup

- Host clicks **"🔄 Reset for New Event"** button
- Dialog:

  ```
  ⚠️ Reset Event

  This will:
  - Clear all game state
  - Reset team statuses to "waiting"
  - Clear team progress/prizes/lifelines-available
  - Keep team configurations (can be edited)
  - Require re-initialization

  [Cancel]  [Reset Event]
  ```

- Host confirms
- System performs comprehensive Firebase reset:

```javascript
// Firebase updates (kebab-case keys)
{
  // Reset game state
  "game-state/game-status": "not-started",
  "game-state/current-team-id": null,
  "game-state/current-question-number": 0,
  "game-state/current-question": null,
  "game-state/question-visible": false,
  "game-state/options-visible": false,
  "game-state/answer-revealed": false,
  "game-state/correct-option": null,
  "game-state/play-queue": null,
  "game-state/question-set-assignments": null,
  "game-state/initialized-at": null,
  "game-state/started-at": null,
  "game-state/last-updated": serverTimestamp(),

  // Reset each team
  "teams/team-1/status": "waiting",
  "teams/team-1/current-prize": 0,
  "teams/team-1/current-question-index": 0,
  "teams/team-1/questions-answered": 0,
  "teams/team-1/question-set-id": null,
  "teams/team-1/lifelines-available": {
    "phone-a-friend": true,
    "fifty-fifty": true
  },
  "teams/team-1/eliminated-at": null,
  "teams/team-1/completed-at": null,
  "teams/team-1/last-updated": serverTimestamp(),
  // ... (repeat for all teams)
}
```

- Returns to "Event Not Started" state
- Ready for next event (or can reconfigure teams/questions)

---

## Key System Behaviors Summary

### Automatic vs Manual Actions

**Automatic (No host input):**

- Team order randomization (on initialization)
- Question set assignment (on initialization)
- Answer validation (correct/incorrect) after "Lock Answer"
- Prize money calculation based on prize-structure
- Next question number increment
- Team status updates (`waiting` → `active` → `eliminated`/`completed`)
- Real-time Firebase sync to public display

**Manual (Requires host action):**

- Initialize Game
- Start Game (with confirmation)
- Load Question (from Firebase question-sets)
- Push to Display (push to Firebase)
- Register team's answer selection (A/B/C/D)
- Lock Answer (triggers automatic validation)
- Lifeline activation
- Skip question
- Pause/Resume
- Next Team
- End Event

### Data Flow Summary

```
Host Action → Firebase question data → Validation Logic → Firebase Update → Public Display Update

Example Flow:
1. Host loads Question 5 (from Firebase question-sets with correct answer)
2. System shows question to host with correct answer indicator
3. Host clicks "Push to Display"
4. Question pushed to Firebase WITHOUT correct answer
5. Public display receives real-time update and renders question
6. Team verbally announces answer: "B"
7. Host clicks "B" button (local state, no Firebase sync)
8. Host clicks "Lock Answer"
9. System validates B against correct answer from Firebase question-sets
10. If correct: System updates Firebase with new prize, question number
11. Public display receives update and shows green checkmark + new prize
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

For uploading question sets:

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
    },
    {
      "id": "q2",
      "number": 2,
      "text": "Who wrote 'Romeo and Juliet'?",
      "options": {
        "A": "Charles Dickens",
        "B": "William Shakespeare",
        "C": "Mark Twain",
        "D": "Jane Austen"
      },
      "correctAnswer": "B",
      "difficulty": "easy",
      "category": "Literature"
    }
    // ... (QUESTIONS_PER_SET - 2) more questions to total QUESTIONS_PER_SET
  ]
}
```

---

## UI State Machine

```
[Not Started] (game-status: "not-started")
    ↓ Initialize Game
[Initialized] (game-status: "initialized")
    ↓ Start Game (with confirmation dialog)
[Active - No Question] (game-status: "active", question-visible: false)
    ↓ Load Question
[Question Loaded] (host view only)
    ↓ Push to Display
[Question Visible] (question-visible: true)
    ↓ Team Selects Answer
[Answer Selected] (local state)
    ↓ Lock Answer
[Validating...] (automatic)
    ↓
[Correct] → [Next Question] → Loop back to [Active - No Question]
    OR
[Incorrect] → Check Lifelines → [Offer Lifeline] OR [Eliminate] → [Next Team]
    OR
[All Questions Complete] → [Team Completed] → [Next Team]
    OR
[All Teams Complete] → [Event Complete] (game-status: "completed")
```

---

## Document Summary

This updated journey reflects:

- ✅ Pre-event validation with grouped checks (teams, questions, prizes)
- ✅ References to `QUESTIONS_PER_SET` constant instead of hardcoded values
- ✅ Initialize Game Modal with three stages (preview, processing, results)
- ✅ Atomic Firebase updates with multi-path patterns
- ✅ Correct kebab-case Firebase key references throughout
- ✅ Clear distinction between initialization and starting the event
- ✅ **Start Game confirmation dialog with team and question set details**
- ✅ **Question set loading from Firebase question-sets before navigation**
- ✅ **Success toast notification on game start**
- ✅ Automatic random team selection and question set assignment (1:1 mapping)
- ✅ Automatic answer validation with single "Lock Answer" button
- ✅ Play queue preview showing team order and assignments
- ✅ Streamlined host controls with proper button state management
- ✅ Clear separation between pre-event setup and live event management
- ✅ Real-time synchronization patterns between host panel and public display
- ✅ Edge case handling for accessing initialized games across multiple browsers

- **Document Version:** 2.2.0
- **Last Updated:** February 2026
- **Status:** Production Reference
