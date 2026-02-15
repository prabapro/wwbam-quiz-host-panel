# Phase 2: Pre-Event Setup

- **Dependencies:** Phase 1 (All stores and services)
- **Status:** Completed

| Requirement ID    | Description                 | User Story                                                                                        | Expected Behavior/Outcome                                                                                                                              |
| ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P2-REQ-001** ✅ | Question Management Page    | As a host, I need a page to manage question sets so that I can prepare questions before the event | - Navigate to /questions<br>- See uploaded sets list<br>- Upload, view, delete operations<br>- Responsive layout                                       |
| **P2-REQ-002** ✅ | Question Uploader Component | As a host, I need to upload JSON files so that question sets are stored in Firebase               | - Drag & drop or file picker<br>- Real-time validation feedback<br>- Progress indicator<br>- Success/error messages<br>- Supports multiple uploads     |
| **P2-REQ-003** ✅ | Question Set List Component | As a host, I need to see all uploaded question sets so that I can verify preparation              | - Card layout with set details<br>- Set name, question count, upload date<br>- Actions: View, Delete, Export<br>- Empty state with upload prompt       |
| **P2-REQ-004** ✅ | Question Set Viewer         | As a host, I need to preview question sets so that I can verify content quality                   | - Modal with question list<br>- Show: text, options, correct answer<br>- Navigate through questions<br>- Close without saving                          |
| **P2-REQ-005** ✅ | Question Set Deletion       | As a host, I need to delete incorrect question sets so that only valid sets remain                | - Confirmation dialog<br>- Remove from Firebase<br>- Update UI immediately<br>- Cannot delete if assigned to team                                      |
| **P2-REQ-006** ✅ | Team Configuration Page     | As a host, I need to configure teams before the event so that team data is ready                  | - Navigate to /teams<br>- Add team form<br>- Team list view<br>- Edit/delete teams                                                                     |
| **P2-REQ-007** ✅ | Add Team Form               | As a host, I need to add teams with details so that participant information is captured           | - Fields: Team name, participants, contact<br>- Validation (required fields)<br>- Save to Firebase<br>- Clear form after save                          |
| **P2-REQ-008** ✅ | Team Configuration List     | As a host, I need to see configured teams so that I can verify setup                              | - Card grid layout<br>- Show: name, participants, status<br>- Actions: Edit, Delete<br>- Empty state guide                                             |
| **P2-REQ-009** ✅ | Edit Team                   | As a host, I need to edit team details so that I can correct mistakes                             | - Pre-fill form with existing data<br>- Update in Firebase<br>- Validate changes<br>- Show confirmation                                                |
| **P2-REQ-010** ✅ | Delete Team                 | As a host, I need to delete teams so that I can remove mistakes                                   | - Confirmation dialog<br>- Remove from Firebase<br>- Cannot delete if game started<br>- Show toast notification                                        |
| **P2-REQ-011** ✅ | Team Uploader Component     | As a host, I need to bulk upload teams so that I can save time with many teams                    | - Accept JSON file with team array<br>- Validate structure<br>- Preview before save<br>- Create all teams atomically                                   |
| **P2-REQ-012** ✅ | Prize Configuration Page    | As a host, I need to configure prizes so that reward structure is customized                      | - Navigate to /prizes<br>- Edit prize values<br>- See prize ladder preview<br>- Save to Firebase                                                       |
| **P2-REQ-013** ✅ | Prize Input Component       | As a host, I need to input prize values so that I can set rewards for each level                  | - Input fields for each question (1-20)<br>- Number validation (positive)<br>- Currency formatting (Rs.)<br>- Default values prefilled                 |
| **P2-REQ-014** ✅ | Prize Milestone Marking     | As a host, I need to mark milestone questions so that key levels are highlighted                  | - Checkboxes for questions 5, 10, 15, 20<br>- Visual distinction (bold/color)<br>- Persist in Firebase<br>- Show on public display                     |
| **P2-REQ-015** ✅ | Prize Ladder View           | As a host, I need a visual ladder view so that I can see prizes in game order                     | - Reverse order (highest first)<br>- Milestone highlighting<br>- Inline input fields<br>- Formatted display<br>- Visual hierarchy                      |
| **P2-REQ-016** ✅ | Prize Structure Table View  | As a host, I need a table view for bulk editing so that I can efficiently manage many levels      | - Sortable table layout<br>- Question number column<br>- Editable prize inputs<br>- Milestone indicators<br>- Formatted preview                        |
| **P2-REQ-017** ✅ | Prize Validation & Sync     | As a host, I need validation and Firebase sync so that prize data integrity is maintained         | - Positive number validation<br>- At least 1 level required<br>- Firebase sync with confirmation<br>- Default structure reset<br>- Active game warning |
| **P2-REQ-018** ✅ | Setup Verification View     | As a host, I need to verify complete setup so that I know everything is ready                     | - Summary: X teams, Y question sets<br>- Validation checks with status<br>- Warning for incomplete setup<br>- "Ready" badge when complete              |

**Phase 2 Acceptance Criteria:**

- ✅ Can upload valid question sets successfully
- ✅ Invalid JSON shows clear error messages
- ✅ Can add/edit/delete teams before game starts
- ✅ Can configure prize structure with custom levels
- ✅ Prize changes sync to Firebase with validation
- ✅ Milestone questions are visually highlighted
- ✅ Can switch between ladder and table views
- ✅ Setup verification accurately reflects readiness
- ✅ All data persists correctly in Firebase
