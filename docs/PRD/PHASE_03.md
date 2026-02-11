# Phase 3: Game Initialization

- **Dependencies:** Phase 2 (Teams configured, Questions uploaded)
- **Status:** Completed
- **USER_JOURNEY Reference:** [Journey 2: Game Initialization](../USER_JOURNEY.md#journey-2-event-day---game-initialization), [Journey 2.5: Multi-Browser Edge Case](../USER_JOURNEY.md#journey-25-multi-browser-edge-case---missing-question-sets)

| Requirement ID    | Description                        | User Story                                                                                        | Expected Behavior/Outcome                                                                                                                                                                                    |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P3-REQ-001** ✅ | Initialize Game Button             | As a host, I need a clear button to start initialization so that I know when I'm ready to begin   | - Button appears when setup complete<br>- Opens initialization modal<br>- Clear visual hierarchy<br>- Disabled state when not ready                                                                          |
| **P3-REQ-002** ✅ | Preview Modal - Stage 1            | As a host, I need to preview teams and question sets before randomizing so that I can verify data | - Modal shows all teams (names only)<br>- Modal shows all question sets (names only)<br>- Warning about random assignment<br>- Cancel and Initialize buttons                                                 |
| **P3-REQ-003** ✅ | Processing State - Stage 2         | As a host, I need visual feedback during initialization so that I know the process is working     | - Loading spinner<br>- Progress messages (shuffling, assigning, saving)<br>- No user interaction needed<br>- Prevents accidental closes                                                                      |
| **P3-REQ-004** ✅ | Play Queue Generation              | As a system, I need to shuffle teams and assign question sets randomly so that gameplay is fair   | - Fisher-Yates shuffle algorithm<br>- Random 1:1 assignment (team → question set)<br>- Validate sufficient question sets<br>- Store in Firebase (playQueue, questionSetAssignments)                          |
| **P3-REQ-005** ✅ | Results Display - Stage 3          | As a host, I need to see the final play order so that I can verify initialization success         | - Numbered list: 1. Team Name → Question Set Name<br>- Clear success message<br>- Close or Go to Dashboard buttons<br>- Data persisted to Firebase                                                           |
| **P3-REQ-006** ✅ | Play Queue Display Component       | As a host, I need a reusable play queue view so that I can see team order anywhere                | - Reusable component (used in modal and homepage)<br>- Numbered list with team → set mapping<br>- Highlight current team (if game active)<br>- Responsive layout                                             |
| **P3-REQ-007** ✅ | Game Control Panel                 | As a host, I need post-initialization controls so that I can manage the game state                | - "Ready to Play" status indicator<br>- Collapsible play queue<br>- [Play Game] button (links to /play)<br>- [Uninitialize] button<br>- Shows on homepage after initialization                               |
| **P3-REQ-008** ✅ | Uninitialize Function              | As a host, I need to reset initialization so that I can correct mistakes                          | - Confirmation dialog before reset<br>- Clears playQueue and questionSetAssignments<br>- Resets gameStatus to NOT_STARTED<br>- Syncs with Firebase<br>- Shows "Initialize Game" button again                 |
| **P3-REQ-009** ✅ | Game Status Persistence            | As a system, I need to persist initialization state so that page refreshes don't lose progress    | - Store playQueue in Firebase<br>- Store questionSetAssignments in Firebase<br>- Store gameStatus in Firebase<br>- Restore state on page load<br>- Zustand + Firebase sync                                   |
| **P3-REQ-010** ✅ | Initialization Validation          | As a system, I need to validate prerequisites so that initialization only proceeds when safe      | - Verify: ≥1 team configured<br>- Verify: ≥1 question set uploaded<br>- Verify: questionSets.length ≥ teams.length<br>- Show specific error for each failure<br>- Prevent initialization if validation fails |
| **P3-REQ-011** ✅ | Atomic Multi-Path Firebase Updates | As a system, I need atomic updates so that game-state and teams stay synchronized                 | - Single atomic update to both game-state and teams nodes<br>- Updates game-state/question-set-assignments<br>- Updates teams/{teamId}/question-set-id for each team<br>- All-or-nothing transaction         |
| **P3-REQ-012** ✅ | Missing Question Sets Detection    | As a host, I need to see missing sets alert so that I can continue game on different browser      | - MissingQuestionSetsAlert component<br>- Detects initialized game without local question sets<br>- Shows required vs found vs missing sets<br>- Upload button to Question Management page                   |
| **P3-REQ-013** ✅ | Required Question Sets Validation  | As a system, I need to validate required sets so that multi-browser access works                  | - useSetupVerification hook enhancement<br>- Extract required set IDs from Firebase assignments<br>- Compare against localStorage metadata<br>- Real-time validation as sets uploaded                        |
| **P3-REQ-014** ✅ | Auto-Recovery Flow                 | As a host, I need auto-recovery so that alert updates when I upload missing sets                  | - Alert re-validates automatically<br>- Status updates in real-time (Missing → Found)<br>- Continue button enabled when all sets found<br>- Seamless transition to GameControlPanel                          |

**Phase 3 Acceptance Criteria:**

- ✅ "Initialize Game" button appears only when setup is complete
- ✅ Modal shows preview of teams and question sets before randomizing
- ✅ Team order is randomly shuffled using proper algorithm
- ✅ Each team gets unique question set assignment
- ✅ Play queue displays clearly with team → set mapping
- ✅ Play queue persists across page reloads
- ✅ Cannot initialize without sufficient question sets
- ✅ Uninitialize resets game to pre-initialization state
- ✅ Game Control Panel shows correct status after initialization
- ✅ All state changes sync to Firebase correctly
- ✅ Atomic updates ensure game-state and teams nodes stay synchronized
- ✅ Missing question sets detected when game opened on different browser
- ✅ Alert shows required, found, and missing sets with real-time updates
- ✅ Auto-recovery flow allows seamless continuation when all sets uploaded
