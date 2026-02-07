# Phase 3: Game Initialization

- **Dependencies:** Phase 2 (Teams configured, Questions uploaded)
- **Status:** Pending

| Requirement ID | Description                      | User Story                                                                                    | Expected Behavior/Outcome                                                                                                                             |
| -------------- | -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P3-REQ-001** | Dashboard Page                   | As a host, I need a main control panel so that I can manage the entire event                  | - Navigate to / (requires auth)<br>- Overview of game state<br>- Quick actions panel<br>- Status indicators                                           |
| **P3-REQ-002** | Initialize Game Logic            | As a host, I need to initialize the game so that teams and questions are randomly assigned    | - Shuffle team order<br>- Randomly assign question sets<br>- Create play queue<br>- Validate sufficient question sets<br>- One-click operation        |
| **P3-REQ-003** | Initialize Game UI               | As a host, I need an initialize button so that I can prepare the game for start               | - "Initialize Game" button<br>- Disabled if already initialized<br>- Loading state during process<br>- Success message with queue preview             |
| **P3-REQ-004** | Play Queue Generation            | As a system, I need to generate randomized play order so that teams play fairly               | - Random shuffle algorithm<br>- Assign unique question set per team<br>- Validate no duplicate assignments<br>- Store queue in Firebase               |
| **P3-REQ-005** | Play Queue Display               | As a host, I need to see the play order so that I know the sequence                           | - Numbered list: 1. Team → Question Set<br>- Highlight current team<br>- Show remaining teams<br>- Scroll to active team                              |
| **P3-REQ-006** | Start Event Button               | As a host, I need to start the event so that the game becomes active                          | - "Start Event" button<br>- Only enabled after initialization<br>- Update Firebase: game-status = 'active'<br>- Auto-select first team                |
| **P3-REQ-007** | First Team Auto-Selection        | As a system, I need to auto-select the first team so that gameplay begins smoothly            | - Load first team from queue<br>- Update current-team-id in Firebase<br>- Set team status to 'active'<br>- Load team's question set from localStorage |
| **P3-REQ-008** | Game Initialization Validation   | As a system, I need to validate prerequisites so that initialization only proceeds when ready | - Check: ≥1 team configured<br>- Check: ≥ question sets ≥ teams<br>- Check: All question sets valid<br>- Show specific error for each failure         |
| **P3-REQ-009** | Initialization State Persistence | As a system, I need to save initialization state so that page refreshes don't reset the game  | - Store play queue in Firebase<br>- Store assignments in Firebase<br>- Store initialization timestamp<br>- Restore state on page load                 |

**Phase 3 Acceptance Criteria:**

- ✅ Initialize game shuffles teams randomly
- ✅ Each team gets unique question set
- ✅ Play queue persists across page reloads
- ✅ Cannot initialize without sufficient setup
- ✅ Start event activates first team automatically
