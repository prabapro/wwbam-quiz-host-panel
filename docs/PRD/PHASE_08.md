# Phase 8: Post-Game & Analytics

- **Dependencies:** Phase 7 (Edge cases handled)
- **Status:** Pending

| Requirement ID | Description                          | User Story                                                                    | Expected Behavior/Outcome                                                                                                                                                                |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P8-REQ-001** | Game Results Page                    | As a host, I need to view final results so that I can see event outcomes      | - Navigate to /results<br>- Summary statistics<br>- Team standings<br>- Prize distribution<br>- Export options                                                                           |
| **P8-REQ-002** | Final Standings Display              | As a host, I need to see standings so that I know who won                     | - Winners section (completed teams)<br>- Prize winners (eliminated with money)<br>- Eliminated (no money)<br>- Sort by prize descending<br>- Show team names + final amounts             |
| **P8-REQ-003** | Event Statistics                     | As a host, I need event stats so that I can analyze the game                  | - Total teams: X<br>- Winners: Y<br>- Eliminated: Z<br>- Total prize distributed: Rs.XXX<br>- Average prize: Rs.XXX<br>- Questions answered (total)                                      |
| **P8-REQ-004** | Export Results to CSV                | As a host, I need CSV export so that I can share results                      | - "Export CSV" button<br>- Columns: Team, Status, Questions, Prize, Lifelines Used, Timestamp<br>- Download triggers<br>- Filename: results_YYYY-MM-DD.csv                               |
| **P8-REQ-005** | Export Results to JSON               | As a host, I need JSON export so that I can import elsewhere                  | - "Export JSON" button<br>- Full game data structure<br>- Include: teams, questions answered, timestamps<br>- Download triggers<br>- Filename: results_YYYY-MM-DD.json                   |
| **P8-REQ-006** | Show Final Results on Public Display | As a host, I need to show results publicly so that audience sees outcomes     | - "Show Final Results" button<br>- Push results to Firebase<br>- Public display shows winners<br>- Team standings<br>- Thank you message<br>- Event complete screen                      |
| **P8-REQ-007** | Reset for New Event                  | As a host, I need to reset the game so that I can run another event           | - "🔄 Reset Event" button<br>- Confirmation dialog with warnings<br>- Clears: game-state, team progress, queue<br>- Keeps: team names, question sets<br>- Returns to "Not Started" state |
| **P8-REQ-008** | Reset Confirmation Dialog            | As a host, I need clear reset warnings so that I don't lose data accidentally | - List what will be cleared<br>- List what will be kept<br>- "This cannot be undone" warning<br>- Buttons: Cancel, Reset Event<br>- Require typing "RESET" for safety                    |
| **P8-REQ-009** | Archive Completed Event (Optional)   | As a host, I need to save event history so that I can review past games       | - Auto-save results before reset<br>- Store in Firebase archive node<br>- Include: date, teams, results<br>- View past events list<br>- Load archived event (read-only)                  |
| **P8-REQ-010** | Event Summary Report                 | As a host, I need a printable summary so that I can share with stakeholders   | - Generate PDF/print view<br>- Include: Event name, date, teams, results<br>- Professional layout<br>- Print button<br>- Download PDF option                                             |
| **P8-REQ-011** | Individual Team Reports              | As a host, I need per-team reports so that I can give participants details    | - Filter by team<br>- Show: questions answered, lifelines used, final prize<br>- Question-by-question breakdown<br>- Export individual report                                            |
| **P8-REQ-012** | Leaderboard Generation               | As a host, I need a leaderboard so that I can display rankings                | - Rank teams by prize<br>- Show: rank, team name, prize<br>- Highlight winner(s)<br>- Export as image or PDF<br>- Suitable for public display                                            |

**Phase 8 Acceptance Criteria:**

- ✅ Results page shows accurate final data
- ✅ CSV/JSON export includes all relevant data
- ✅ Reset clears game state completely
- ✅ Reset preserves team configs and questions
- ✅ Public display shows final results correctly
- ✅ Reports are professional and accurate
