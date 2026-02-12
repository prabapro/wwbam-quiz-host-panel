# Phase 4: Core Game Play - Question Flow

- **Dependencies:** Phase 3 (Game initialized and started)
- **Status:** In Progress
- **USER_JOURNEY Reference:** [Journey 3, Phase B: Question Cycle](../USER_JOURNEY.md#phase-b-question-cycle-repeat-up-to-questions_per_set-times-or-until-elimination)

| Requirement ID | Description                        | User Story                                                                        | Expected Behavior/Outcome                                                                                                                                                                                           |
| -------------- | ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P4-REQ-001** | Question Control Panel Component   | As a host, I need a question control panel so that I can manage question display  | - Compact panel with all controls (`/play`)<br>- Question preview (host only)<br>- Action buttons: Load, Show, Lock<br>- Current question number indicator                                                          |
| **P4-REQ-002** | Load Question Functionality        | As a host, I need to load questions so that I can preview before showing          | - Fetch next question from localStorage<br>- Show question text + options to HOST<br>- Display correct answer (green indicator)<br>- Enable "Show Question" button                                                  |
| **P4-REQ-003** | Show Question to Public            | As a host, I need to display questions so that teams can see them                 | - Push question to Firebase (WITHOUT correct answer)<br>- Set question-visible = true<br>- Set options-visible = true<br>- Public display updates instantly                                                         |
| **P4-REQ-004** | Answer Pad Component               | As a host, I need an answer input so that I can register team's answer            | - 4 buttons: A, B, C, D<br>- Click to select (yellow highlight)<br>- Can change selection before lock<br>- Visual feedback on selection                                                                             |
| **P4-REQ-005** | Lock Answer Functionality          | As a host, I need to lock answers so that validation occurs                       | - "Lock Answer" button<br>- Disabled until answer selected<br>- Triggers automatic validation<br>- Cannot unlock after validation                                                                                   |
| **P4-REQ-006** | Automatic Answer Validation        | As a system, I need to validate answers so that correct/incorrect is determined   | - Compare selected vs localStorage correct answer<br>- Return boolean + correct answer<br>- Trigger appropriate flow (correct/incorrect)<br>- Log validation event                                                  |
| **P4-REQ-007** | Correct Answer Flow                | As a system, I need to handle correct answers so that teams progress              | - Push correct-option to Firebase<br>- Set answer-revealed = true<br>- Update team's current-prize<br>- Increment current-question-number<br>- Increment team's questions-answered<br>- Show "Next Question" button |
| **P4-REQ-008** | Correct Answer Visual Feedback     | As a host/team, I need visual confirmation so that success is celebrated          | - Green checkmark animation<br>- Highlight correct option (green)<br>- Show confetti effect<br>- Display new prize amount<br>- Prize ladder advances                                                                |
| **P4-REQ-009** | Incorrect Answer Detection         | As a system, I need to detect wrong answers so that appropriate actions are taken | - Determine answer is incorrect<br>- Check team's lifeline status<br>- Branch: Has lifelines → Offer choice<br>- Branch: No lifelines → Auto-eliminate                                                              |
| **P4-REQ-010** | Incorrect Answer with Lifelines    | As a host, I need to offer lifelines so that teams get second chances             | - Show dialog: "Wrong Answer - Lifelines Available"<br>- Display available lifelines<br>- Buttons: "Offer Lifeline" or "Eliminate Team"<br>- Do NOT reveal correct answer yet                                       |
| **P4-REQ-011** | Incorrect Answer without Lifelines | As a system, I need to eliminate teams so that game rules are enforced            | - Show X animation<br>- Reveal correct answer (green)<br>- Set team status = 'eliminated'<br>- Freeze final prize<br>- Show "Next Team" button                                                                      |
| **P4-REQ-012** | Next Question Navigation           | As a host, I need to proceed to next question so that gameplay continues          | - "Next Question" button<br>- Clear current question display<br>- Reset answer pad<br>- Return to "Load Question" state<br>- Update question counter UI                                                             |
| **P4-REQ-013** | Question Progress Indicator        | As a host, I need to track progress so that I know how far team has advanced      | - "Question X/QUESTIONS_PER_SET" display<br>- Progress bar (optional)<br>- Highlight current prize level<br>- Color code by milestone                                                                               |
| **P4-REQ-014** | Host Question View                 | As a host, I need to see correct answers so that I can validate responses         | - Question text (large, readable)<br>- All 4 options clearly labeled<br>- Correct answer marked (✓ green indicator)<br>- "Visible to HOST ONLY" badge<br>- Cannot be shared to public display                       |

---

## Phase 4 File Structure

**Modular Organization:**

The Play page is organized into a modular structure to keep components small, focused, and maintainable:

```
src/pages/play/
├── index.jsx                      # Main orchestrator (pulls from stores)
├── components/                    # UI components
│   ├── GameStatusBar.jsx         # P4-REQ-013: Question Progress Indicator
│   ├── QuestionPanel.jsx         # P4-REQ-001, P4-REQ-014: Question display
│   ├── AnswerPad.jsx             # P4-REQ-004: Answer selection buttons
│   ├── GameControls.jsx          # P4-REQ-001, P4-REQ-002, P4-REQ-003, P4-REQ-012
│   ├── LifelinePanel.jsx         # Phase 5 (placed here for UI cohesion)
│   └── TeamStatusCard.jsx        # Phase 5 (placed here for UI cohesion)
├── hooks/                         # Business logic hooks
│   ├── useCurrentQuestion.js     # Question lifecycle management
│   ├── useAnswerSelection.js     # P4-REQ-005, P4-REQ-006: Answer validation
│   └── useGameControls.js        # Smart button state management
└── (utilities at root level)      # Pure functions
    src/utils/gameplay/
    ├── answerValidation.js       # P4-REQ-006: Validation logic
    ├── scoreCalculation.js       # P4-REQ-007: Prize calculations
    └── lifelineLogic.js          # Phase 5: Lifeline logic
```

### Component Responsibilities:

**Play/index.jsx** (Main Orchestrator)

- Pulls state from all stores (game, teams, questions, prizes)
- Renders layout with all child components
- Handles navigation and redirects
- Shows debug info (development)

**GameStatusBar.jsx** (P4-REQ-013)

- Displays current game status at a glance
- Shows: Team name, Question #, Prize, Timer
- Sticky or prominent positioning
- Real-time updates from stores

**QuestionPanel.jsx** (P4-REQ-001, P4-REQ-014)

- Displays question text and options
- HOST VIEW: Shows correct answer indicator (never synced to Firebase)
- PUBLIC VIEW: Shows question without answer
- Visual states: loading, visible, revealed
- Handles 50/50 filtered options display

**AnswerPad.jsx** (P4-REQ-004, P4-REQ-005)

- Four clickable buttons (A, B, C, D)
- Selection highlighting (yellow)
- "Lock Answer" button (triggers validation)
- Disabled states based on game flow
- Local state only (not synced until locked)

**GameControls.jsx** (P4-REQ-002, P4-REQ-003, P4-REQ-012)

- Load Question button
- Show Question button
- Hide Question button
- Next Question button
- Next Team button
- Skip Question button
- Pause/Resume buttons
- Smart state management via useGameControls hook

**LifelinePanel.jsx** (Phase 5)

- Phone-a-Friend button
- 50/50 button
- Shows available/used status
- Triggers lifeline logic

**TeamStatusCard.jsx** (Phase 5)

- Current team details
- Progress visualization
- Prize display
- Lifeline status indicators

### Custom Hooks:

**useCurrentQuestion.js**

- Manages current question state
- Loads question from localStorage (with correct answer)
- Pushes question to Firebase (without correct answer)
- Handles visibility flags (questionVisible, optionsVisible)
- Tracks loading and error states

**useAnswerSelection.js** (P4-REQ-005, P4-REQ-006)

- Tracks selected answer (local state)
- Validates answer on lock
- Handles validation result
- Updates team prize on correct answer
- Triggers lifeline offer or elimination on incorrect

**useGameControls.js**

- Calculates button enabled/disabled states
- Enforces game flow rules
- Provides handlers for all control actions
- Tracks operation states (loading, error)
- Smart state management based on game state

### Utility Functions:

**answerValidation.js** (P4-REQ-006)

- `validateAnswer(selected, correct)` - Compare answers
- `normalizeOption(option)` - Normalize A/B/C/D
- `isValidAnswerOption(option)` - Validate option format
- Pure functions, easily testable

**scoreCalculation.js** (P4-REQ-007)

- `getPrizeForQuestion(number, structure)` - Get prize amount
- `getNextPrizeAmount(current, structure)` - Calculate next prize
- `getGuaranteedPrize(answered, structure)` - Milestone-based prize
- `isMilestone(number)` - Check if milestone question
- `formatPrize(amount)` - Format for display

**lifelineLogic.js** (Phase 5)

- `applyFiftyFifty(options, correct)` - Remove 2 incorrect answers
- `isLifelineAvailable(team, type)` - Check availability
- `formatTimerDisplay(seconds)` - Format MM:SS
- `getAvailableLifelines(team)` - List available lifelines

### Design Rationale:

1. **Modular Components**: Each component has a single, clear responsibility
2. **Custom Hooks**: Centralize business logic, keep components lean
3. **Pure Utilities**: Enable easy unit testing without mocking
4. **Clear Separation**: UI (components) vs Logic (hooks) vs Data (stores)
5. **Scalability**: Easy to add new features without touching core logic
6. **Maintainability**: Small files, focused code, easy to debug
7. **Testability**: Hooks and utilities can be tested in isolation

---

**Phase 4 Acceptance Criteria:**

- ✅ Questions load from localStorage correctly
- ✅ Only question/options pushed to Firebase (no answer)
- ✅ Answer validation is accurate
- ✅ Correct flow updates prize and progresses
- ✅ Incorrect flow checks lifelines appropriately
- ✅ UI clearly distinguishes host vs public view
- ✅ Modular structure implemented with proper separation of concerns
- ✅ Custom hooks centralize business logic
- ✅ Utility functions are pure and testable
