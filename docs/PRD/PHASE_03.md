# Phase 3: Game Initialization

- **Dependencies:** Phase 2 (Teams configured, Questions uploaded)
- **Status:** Completed
- **USER_JOURNEY Reference:** [Journey 2: Game Initialization](../USER_JOURNEY.md#journey-2-event-day---game-initialization)

| Requirement ID    | Description                        | User Story                                                                                        | Expected Behavior/Outcome                                                                                                                                                                                    |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P3-REQ-001** ✅ | Initialize Game Button             | As a host, I need a clear button to start initialization so that I know when I'm ready to begin   | - Button appears when setup complete<br>- Opens initialization modal<br>- Clear visual hierarchy<br>- Disabled state when not ready                                                                          |
| **P3-REQ-002** ✅ | Preview Modal - Stage 1            | As a host, I need to preview teams and question sets before randomizing so that I can verify data | - Modal shows all teams (names only)<br>- Modal shows all question sets (names only)<br>- Warning about random assignment<br>- Cancel and Initialize buttons                                                 |
| **P3-REQ-003** ✅ | Processing State - Stage 2         | As a host, I need visual feedback during initialization so that I know the process is working     | - Loading spinner<br>- Progress messages (shuffling, assigning, saving)<br>- No user interaction needed<br>- Prevents accidental closes                                                                      |
| **P3-REQ-004** ✅ | Play Queue Generation              | As a system, I need to shuffle teams and assign question sets randomly so that gameplay is fair   | - Fisher-Yates shuffle algorithm<br>- Random 1:1 assignment (team → question set)<br>- Validate sufficient question sets<br>- Store in Firebase (playQueue, questionSetAssignments)                          |
| **P3-REQ-005** ✅ | Results Display - Stage 3          | As a host, I need to see the final play order so that I can verify initialization success         | - Numbered list: 1. Team Name → Set Name<br>- Clear table layout<br>- Team names + assigned set names<br>- Close button to return to dashboard                                                               |
| **P3-REQ-006** ✅ | Start Game Modal                   | As a host, I need confirmation before starting so that I don't accidentally begin gameplay        | - Modal shows first team and assigned set<br>- Warns that starting is irreversible<br>- Cancel and Start Game buttons<br>- Only appears after initialization                                                 |
| **P3-REQ-007** ✅ | Question Set Loading               | As a system, I need to load first team's question set so that questions are ready for gameplay    | - Fetch assigned question set from Firebase<br>- Load into Questions Store<br>- Validate 20 questions present<br>- Show error if set unavailable                                                             |
| **P3-REQ-008** ✅ | Game Start Atomic Update           | As a system, I need to update game state atomically so that status transitions are consistent     | - Atomic Firebase update:<br> → game-status = 'active'<br> → current-team-id = first from queue<br> → first team status = 'active'<br> → started-at = timestamp                                              |
| **P3-REQ-009** ✅ | Post-Start Navigation              | As a host, I need automatic navigation after start so that I can manage gameplay immediately      | - Navigate to /play route<br>- Show GameControlPanel<br>- Display first team info<br>- Enable question loading                                                                                               |
| **P3-REQ-010** ✅ | Initialization Validation          | As a system, I need to validate prerequisites so that initialization only proceeds when safe      | - Verify: ≥1 team configured<br>- Verify: ≥1 question set uploaded<br>- Verify: questionSets.length ≥ teams.length<br>- Show specific error for each failure<br>- Prevent initialization if validation fails |
| **P3-REQ-011** ✅ | Atomic Multi-Path Firebase Updates | As a system, I need atomic updates so that game-state and teams stay synchronized                 | - Single atomic update to both game-state and teams nodes<br>- Updates game-state/question-set-assignments<br>- Updates teams/{teamId}/question-set-id for each team<br>- All-or-nothing transaction         |

**Phase 3 Acceptance Criteria:**

- ✅ Can initialize game when setup complete
- ✅ Random assignment is fair (verified via tests)
- ✅ Play queue and assignments saved to Firebase
- ✅ Modal shows correct team-to-set mapping
- ✅ Cannot start game without initialization
- ✅ Question sets load from Firebase successfully
- ✅ Game state transitions atomically
- ✅ Navigation to /play occurs automatically
- ✅ First team is activated correctly
- ✅ All Firebase updates are atomic

**Notes:**

- Multi-browser edge case requirements (P3-REQ-012 through P3-REQ-014) removed as questions are now stored in Firebase and accessible from any browser
- Question sets are loaded from Firebase, eliminating browser-specific storage issues
