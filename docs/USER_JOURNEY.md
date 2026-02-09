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
  - Each set must have exactly 20 questions
  - Each question must have: text, 4 options (A/B/C/D), correct answer
- Question set stored in localStorage with unique ID
- Host sees confirmation: "Question Set 1 uploaded (20 questions)"
- Host repeats for all required sets (e.g., uploads 7-10 question sets)

**Question Sets List View:**

```
📁 Question Set 1 (20 questions) - Ready ✅
📁 Question Set 2 (20 questions) - Ready ✅
📁 Question Set 3 (20 questions) - Ready ✅
...
```

### Step 3: Team Configuration (Pre-Event)

- Host navigates to "Team Configuration" section
- Clicks "Add Team" button
- Dialog opens with form:
  - **Team Name**: [input field] - e.g., "Team Alpha"
  - **Participant Names**: [textarea] - e.g., "John, Sarah, Mike"
  - **Contact**: [input] - Optional phone/email
- Host fills in details and clicks "Save"
- System:
  - Creates team in Firebase with status "waiting"
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

- Host reviews setup summary:
  - ✅ 7 question sets uploaded
  - ✅ 7 teams configured
  - ✅ Firebase connection active
- System shows: "Event Ready - All systems go! 🎯"

---

## Journey 2: Event Day - Game Initialization

### Step 1: Event Start

- Host arrives on event day
- Logs into the panel
- Dashboard shows:
  - All teams with status "Waiting"
  - Question sets loaded
  - Game Status: "Not Started"

### Step 2: Shuffle & Assign

- Host clicks **"Initialize Game"** button
- System performs automatic setup:
  1. **Shuffles team order** randomly
  2. **Assigns question sets** randomly to each team
  3. **Creates play queue** (randomized team order)
  4. Updates Firebase with initialization data

**System Shows:**

```
🎲 Game Initialized!

Play Order:
1. Team Gamma    → Question Set 5
2. Team Alpha    → Question Set 2
3. Team Epsilon  → Question Set 7
4. Team Beta     → Question Set 1
...

[Start Event] button appears
```

### Step 3: Start Event

- Host clicks **"Start Event"** button
- System:
  - Updates Firebase: `game-status = "active"`
  - Automatically selects first team from queue
  - Updates Firebase: `current-team-id = "team-3"` (Team Gamma)
  - Updates Firebase: `teams/team-3/status = "active"`
- Public display shows: "Welcome Team Gamma!"
- Dashboard highlights active team

---

## Journey 3: Active Game Play (Team by Team)

### Phase A: Team's Turn Begins (Automatic)

**System State:**

- Current Team: Team Gamma (auto-selected)
- Question Set: Set 5 (auto-assigned)
- Question Number: 0/20
- Status Bar shows: "🎮 Team Gamma | Question 0/20 | Prize: Rs.0"

### Phase B: Question Cycle (Repeat 20 times or until elimination)

#### Step 1: Load Next Question

- Host clicks **"Load Question"** button (or auto-loads)
- System:
  - Fetches next question from localStorage (Question 1 from Set 5)
  - Loads question data including correct answer key
  - Shows question to HOST ONLY:
    ```
    Question 1: What is the capital of France?
    A: London
    B: Paris ✓ (correct answer - shown only to host)
    C: Berlin
    D: Rome
    ```
  - Host sees: "Question loaded - Ready to display"

#### Step 2: Display Question to Public

- Host clicks **"Show Question"** button
- System:
  - Pushes question to Firebase (WITHOUT correct answer):
    ```json
    {
      "text": "What is the capital of France?",
      "options": ["A: London", "B: Paris", "C: Berlin", "D: Rome"]
    }
    ```
  - Updates Firebase: `question-visible = true, options-visible = true`
  - Public display screen shows the question
  - Host panel shows: "⏳ Waiting for team's answer..."

#### Step 3: Team Selects Answer

- Team discusses and decides on their answer (verbally)
- Team announces: "We'd like to go with B"
- Host clicks the **"B"** button on the answer pad
- System:
  - Highlights B button in yellow
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

#### Step 4A: Lock Answer (Automatic Validation)

- Host clicks **"Lock Answer"** button
- System performs automatic validation:
  1. Compares selected answer (B) with correct answer from localStorage (B)
  2. Result: ✅ CORRECT

**If Correct:**

- System automatically:
  - Updates Firebase: `answer-revealed = true, correct-option = "B"`
  - Public display:
    - Shows green checkmark ✅
    - Highlights B in green
    - Shows confetti animation
    - Displays new prize: "Rs.200"
  - Updates Firebase:
    ```json
    {
      "current-question-number": 2,
      "teams/team-3/current-prize": 200,
      "teams/team-3/questions-answered": 1,
      "teams/team-3/current-question-index": 1
    }
    ```
  - Prize ladder advances to next level
  - Team card updates: "Progress: 1/20 | Prize: Rs.200"
- Host panel shows: "✅ Correct Answer! Team wins Rs.200"
- **"Next Question"** button appears
- Host clicks "Next Question" → Returns to Step 1

#### Step 4B: Lock Answer - Wrong Answer (Automatic Validation)

- Host clicks **"Lock Answer"** button
- System performs automatic validation:
  1. Compares selected answer (C) with correct answer from localStorage (B)
  2. Result: ❌ INCORRECT

**System checks lifeline status:**

**Scenario 1: Team has unused lifelines**

- System automatically:

  - Does NOT reveal correct answer yet
  - Shows host: "❌ Incorrect Answer"
  - Shows host dialog:

    ```
    ⚠️ Wrong Answer - Lifelines Available

    Team has:
    ✅ Phone-a-Friend
    ✅ 50/50

    [Offer Lifeline]  [Eliminate Team]
    ```

  - If "Offer Lifeline" clicked → Go to Step 5 (Lifeline Flow)
  - If "Eliminate Team" clicked → Go to Scenario 2 below

**Scenario 2: Team has NO unused lifelines (or host chooses elimination)**

- System automatically:
  - Shows X animation on public display
  - Reveals correct answer (B highlighted in green)
  - Shows: "The correct answer was B: Paris"
  - Updates Firebase: `teams/team-3/status = "eliminated"`
  - Updates Firebase: `teams/team-3/eliminated-at = timestamp`
  - Freezes final prize at last correct answer
  - Shows: "Team Gamma eliminated - Final Prize: Rs.1,000"
  - Team card turns red with "Eliminated" badge
  - **"Next Team"** button appears
- Host clicks "Next Team" → Go to Phase C

#### Step 5: Lifeline Usage (Before Answer Lock)

**Important:** Team must request lifeline BEFORE clicking their answer

**Phone-a-Friend Flow:**

- Team says: "We'd like to use Phone-a-Friend"
- Host clicks **"Phone-a-Friend"** button
- System:
  - Updates Firebase: `teams/team-3/lifelines/phone-a-friend = false`
  - Button becomes greyed out (disabled)
  - Team card updates: ❌ Phone-a-Friend
  - Host panel shows: "⏸️ Lifeline in use - Timer paused"
- Team makes phone call (3 minutes)
- After call completes → Returns to Step 3 (Team selects answer)

**50/50 Flow:**

- Team says: "We'd like to use 50/50"
- Host clicks **"50/50"** button
- System:
  - Filters options automatically (removes 2 incorrect answers)
  - Updates Firebase: `teams/team-3/lifelines/fifty-fifty = false`
  - Button becomes greyed out
  - Public display updates to show only 2 options:
    ```
    Question 1: What is the capital of France?
    A: London
    B: Paris
    (C and D removed)
    ```
  - Team card updates: ❌ 50/50
- Returns to Step 3 (Team selects answer from remaining options)

#### Step 6: Complete Team's Turn

**Scenario A: Team completes all 20 questions ✅**

- After question 20 answered correctly:
- System:
  - Updates Firebase: `teams/team-3/status = "completed"`
  - Final Prize: Rs.64,000,000
  - Public display shows: "🎉 Congratulations Team Gamma - Rs.64,000,000!"
  - Team card turns green with "WINNER" badge
  - **"Next Team"** button appears

**Scenario B: Team eliminated ❌**

- Already handled in Step 4B Scenario 2

### Phase C: Transition to Next Team (Automatic)

#### Step 7: Load Next Team from Queue

- Host clicks **"Next Team"** button
- System automatically:
  1. Clears current question display
  2. Resets game state
  3. Selects next team from randomized queue
  4. Updates Firebase: `current-team-id = "team-1"` (Team Alpha)
  5. Updates Firebase: `teams/team-1/status = "active"`
  6. Loads Team Alpha's assigned question set (Set 2)
  7. Resets question counter to 0
- Public display shows: "Next up: Team Alpha!"
- Dashboard highlights new active team
- Returns to Phase B, Step 1 (Load Next Question)

---

## Journey 4: Game Management & Monitoring

### Real-Time Dashboard View

**Status Bar (Top):**

```
🎮 ACTIVE: Team Gamma | Question 5/20 | Prize: Rs.2,000 | ⏱️ 00:45
```

**Main Panels:**

1. **Question Control Panel** (Left)

   - Current question display (host view with correct answer)
   - Answer pad (A/B/C/D buttons)
   - Lock Answer button
   - Lifeline buttons (Phone-a-Friend, 50/50)
   - Load Question / Show Question / Next Question buttons

2. **Team Status Panel** (Center)

   - Grid of all team cards
   - Color-coded statuses:
     - 🟦 Blue: Active (currently playing)
     - ⚪ Grey: Waiting (in queue)
     - 🟢 Green: Completed (won max prize)
     - 🔴 Red: Eliminated
   - Each card shows:
     - Team name
     - Progress (X/20)
     - Current prize
     - Lifelines status
     - Question set assigned

3. **Prize Ladder** (Right)
   - Visual ladder from Rs.100 to Rs.64,000,000
   - Current level highlighted
   - Milestone markers

**Control Button States:**

```
Game Not Started:
  ✅ Initialize Game
  ❌ All other buttons disabled

Game Initialized, No Active Team:
  ✅ Start Event
  ❌ Question controls disabled

Active Team, No Question Loaded:
  ✅ Load Question
  ❌ Show Question disabled
  ❌ Answer controls disabled

Question Loaded (Host View Only):
  ✅ Show Question
  ✅ Lifelines (if available)
  ❌ Answer pad disabled

Question Displayed to Public:
  ❌ Show Question disabled
  ✅ Answer pad (A/B/C/D) enabled
  ✅ Lifelines (if available)
  ❌ Lock Answer (until team selects)

Team Answer Selected:
  ✅ Lock Answer enabled
  ✅ Change answer (can click different option)
  ✅ Lifelines (if available)

Answer Locked & Validated:
  ❌ All answer controls disabled
  ✅ Next Question (if correct)
  ✅ Offer Lifeline / Eliminate (if incorrect + lifelines available)
  ✅ Next Team (if completed/eliminated)
```

---

## Journey 5: Edge Cases & Special Scenarios

### Scenario A: Team Walks Away (Optional Rule)

- Team decides to quit with current prize
- Host clicks **"Walk Away"** button
- Dialog: "Confirm Team Gamma walks away with Rs.8,000?"
- Host confirms
- System:
  - Updates Firebase: `teams/team-3/status = "completed"`
  - Final prize = current prize
  - Team card shows "Walked Away - Won Rs.8,000"
  - Next Team button appears

### Scenario B: Technical Issue / Need to Pause

- Host clicks **"⏸️ Pause Game"** button
- System:
  - Updates Firebase: `game-status = "paused"`
  - Freezes current state
  - Public display shows "Game Paused" overlay
  - All controls disabled except "Resume"
- Host resolves issue
- Clicks **"▶️ Resume Game"** button
- Everything continues from where it stopped

### Scenario C: Question Error / Skip Question

- Host realizes question has an error (typo, wrong options, etc.)
- Clicks **"⏭️ Skip Question"** button
- Dialog: "Skip this question? Team will move to next question with no penalty."
- Host confirms
- System:
  - Moves to next question without prize change
  - Logs skipped question (question number + reason)
  - No impact on team's progress
  - Question counter still increments (Q5 → Q6)

### Scenario D: Answer Already Visible, Need to Retract

- Host accidentally clicked "Show Question" too early
- Clicks **"🔙 Hide Question"** button
- System:
  - Updates Firebase: `question-visible = false`
  - Public display clears question
  - Returns to "Question Loaded" state
  - Can show question again when ready

### Scenario E: Wrong Answer Selected by Mistake

- Host clicked wrong button (e.g., clicked C when team said B)
- Host has NOT clicked "Lock Answer" yet
- Simply click the correct button (B)
- System updates selection
- Previous selection automatically deselected
- No confirmation needed until "Lock Answer" is clicked

### Scenario F: Connection Loss

- Firebase connection drops
- System:
  - Shows red "Connection Lost" banner
  - Attempts automatic reconnection
  - Buffers any changes made offline
  - When reconnected: syncs all buffered changes
  - Shows "Connected" confirmation
- Public display continues showing last synced state

---

## Journey 6: Post-Game / End of Event

### Final Steps

#### Step 1: All Teams Completed

- Last team finishes (completed or eliminated)
- System automatically:
  - Updates Firebase: `game-status = "completed"`
  - Generates final standings

#### Step 2: View Final Results

- Dashboard shows summary view:

  ```
  📊 Event Complete - Final Standings

  🏆 Winners (Rs.64,000,000):
  - Team Alpha
  - Team Gamma

  💰 Prize Winners:
  - Team Beta: Rs.16,000 (Eliminated at Q7)
  - Team Delta: Rs.8,000 (Eliminated at Q6)
  - Team Epsilon: Rs.1,000 (Eliminated at Q4)

  ❌ Eliminated (Q1-Q3):
  - Team Zeta: Rs.0

  Total Prize Money Distributed: Rs.128,025,000
  ```

#### Step 3: Export Results (Optional)

- Host clicks **"📥 Export Results"** button
- System generates CSV/JSON file with:
  - Team names
  - Questions answered
  - Final prizes
  - Lifelines used
  - Timestamps
- File downloads to host's computer

#### Step 4: Public Display End Screen

- Host clicks **"Show Final Results"** button
- Public display shows:
  - Winner announcement
  - All team standings
  - Thank you message

#### Step 5: Event Cleanup

- Host clicks **"🔄 Reset for New Event"** button
- Dialog:

  ```
  ⚠️ Reset Event

  This will:
  - Clear all team game data
  - Reset game state
  - Keep team configurations (can be edited)
  - Keep question sets

  [Cancel]  [Reset Event]
  ```

- Host confirms
- System:
  - Clears Firebase game-state
  - Resets team statuses to "waiting"
  - Clears team progress/prizes/lifelines
  - Keeps team names and question sets
  - Returns to "Event Not Started" state
- Ready for next event (or can reconfigure teams)

---

## Key System Behaviors Summary

### Automatic vs Manual Actions

**Automatic (No host input):**

- Team order randomization
- Question set assignment
- Answer validation (correct/incorrect)
- Prize money calculation
- Next question number increment
- Team status updates
- Display updates

**Manual (Requires host action):**

- Initialize Game
- Start Event
- Load Question
- Show Question
- Register team's answer (A/B/C/D)
- Lock Answer (triggers validation)
- Lifeline activation
- Skip question
- Pause/Resume
- Next Team
- End Event

### Data Flow Summary

```
Host Action → localStorage (question data) → Validation Logic → Firebase Update → Public Display Update

Example:
1. Host loads Question 5
2. System fetches from localStorage (includes correct answer)
3. Host shows question to public
4. Question pushed to Firebase (without correct answer)
5. Team selects B, host clicks B button
6. Host clicks "Lock Answer"
7. System validates B == correct answer (from localStorage)
8. System updates Firebase with result
9. Public display shows green checkmark + new prize
```

---

## Question Set JSON Structure (Reference)

For uploading question sets to localStorage:

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
    // ... 18 more questions
  ]
}
```

---

## UI State Machine

```
[Not Started]
    ↓ Initialize Game
[Initialized]
    ↓ Start Event
[Active - No Question]
    ↓ Load Question
[Question Loaded]
    ↓ Show Question
[Question Visible]
    ↓ Team Selects Answer
[Answer Selected]
    ↓ Lock Answer
[Validating...]
    ↓
[Correct] → [Next Question] → Loop back to [Active - No Question]
    OR
[Incorrect] → Check Lifelines → [Offer Lifeline] OR [Eliminate] → [Next Team]
    OR
[All Questions Complete] → [Team Completed] → [Next Team]
    OR
[All Teams Complete] → [Event Complete]
```

---

This updated journey reflects:

- ✅ Pre-configured teams before event
- ✅ Automatic random team selection and question set assignment
- ✅ Automatic answer validation with single "Lock Answer" button
- ✅ Streamlined host controls
- ✅ Clear separation between pre-event setup and live event management
