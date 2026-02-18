# Phase 7: Edge Cases & Game Management

- **Dependencies:** Phase 6 (UI polished)
- **Status:** Completed
- **USER_JOURNEY Reference:** [Journey 5: Edge Cases & Special Scenarios](../USER_JOURNEY.md#journey-5-edge-cases--special-scenarios)

| Requirement ID    | Description                | User Story                                                                            | Expected Behavior/Outcome                                                                                                                                                                                     |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P7-REQ-001** ✅ | Pause Game Functionality   | As a host, I need to pause the game so that I can handle interruptions                | - "⏸️ Pause Game" button<br>- Update game-status = 'paused'<br>- Freeze all controls<br>- Public display shows "Paused" overlay<br>- Enable "Resume" button only                                              |
| **P7-REQ-002** ✅ | Resume Game Functionality  | As a host, I need to resume gameplay so that we can continue after pause              | - "▶️ Resume Game" button<br>- Restore game-status = 'active'<br>- Re-enable controls<br>- Clear pause overlay<br>- Continue from exact state                                                                 |
| **P7-REQ-003** ❌ | Walk Away Option           | As a host, I need a walk away option so that teams can quit with current prize        | - "Walk Away" button (optional feature)<br>- Confirmation dialog<br>- Set status = 'completed'<br>- Prize = current amount<br>- Show "Walked Away" badge                                                      |
| **P7-REQ-004** ✅ | Skip Question              | As a host, I need to skip questions so that I can handle question errors              | - "⏭️ Skip Question" button<br>- Confirmation: "Skip this question?"<br>- Move to next question<br>- No prize change<br>- Log skipped question + reason<br>- Question counter increments                      |
| **P7-REQ-005** ✅ | Hide/Retract Question      | As a host, I need to hide questions so that I can undo accidental reveals             | - "🔙 Hide Question" button<br>- Set question-visible = false<br>- Public display clears<br>- Return to "Question Loaded" state<br>- Can re-show when ready                                                   |
| **P7-REQ-006** ✅ | Change Answer Selection    | As a host, I need to change selected answers so that I can correct mistakes           | - Before "Lock Answer" clicked<br>- Click different option<br>- Previous selection deselected<br>- New selection highlighted<br>- No confirmation needed                                                      |
| **P7-REQ-007** ✅ | Connection Loss Recovery   | As a system, I need to handle disconnections so that game doesn't crash               | - Detect Firebase disconnect<br>- Show "Connection Lost" banner (red)<br>- Buffer changes offline<br>- Auto-reconnect attempts<br>- Sync buffered changes when reconnected<br>- Show "Connected" confirmation |
| **P7-REQ-008** ✅ | Offline Data Persistence   | As a system, I need offline persistence so that data isn't lost                       | - Queue Firebase writes<br>- Store in IndexedDB/localStorage<br>- Retry on reconnect<br>- Show "X changes pending sync"<br>- Mark synced changes                                                              |
| **P7-REQ-009**    | Confirmation Dialogs       | As a host, I need confirmations so that I don't accidentally take destructive actions | - Delete team: "Are you sure?"<br>- Eliminate team: "Confirm elimination?"<br>- Skip question: "Skip this question?"<br>- Reset game: "This will clear all data"<br>- Clear buttons: Confirm/Cancel           |
| **P7-REQ-010** ✅ | Error Boundary Enhancement | As a user, I need graceful error handling so that crashes are recoverable             | - Catch React errors<br>- Show friendly error UI<br>- "Retry" and "Reset" buttons<br>- Log errors to console (dev)<br>- Optional: Send to error service                                                       |
| **P7-REQ-011** ✅ | Firebase Error Handling    | As a developer, I need Firebase error handling so that network issues don't break UI  | - Try-catch all Firebase calls<br>- User-friendly error messages<br>- Retry logic for transient errors<br>- Show toast on failure<br>- Log errors for debugging                                               |
| **P7-REQ-012** ✅ | Validation Error Messages  | As a user, I need clear error messages so that I can fix issues                       | - Field-level validation<br>- Specific error text (not generic)<br>- Highlight invalid fields (red border)<br>- Show error below field<br>- Clear on valid input                                              |
| **P7-REQ-013** ✅ | Session Timeout Handling   | As a system, I need to handle auth timeouts so that hosts re-authenticate             | - Detect auth token expiry<br>- Show "Session expired" dialog<br>- Redirect to login<br>- Preserve redirect URL<br>- Return to same page after login                                                          |
| **P7-REQ-014** ✅ | Concurrent Host Prevention | As a system, I need to prevent multiple hosts so that state doesn't conflict          | - Detect multiple tabs/users<br>- Show warning: "Another host session detected"<br>- Options: Take over / View only<br>- Disable controls if not primary<br>- Use Firebase presence detection                 |

**Phase 7 Acceptance Criteria:**

- ✅ Pause/resume maintains exact game state
- ✅ Connection loss shows clear UI feedback
- ✅ All destructive actions require confirmation
- ✅ Errors display helpful messages
- ✅ Network failures don't crash the app
- ✅ Session timeout redirects to login
