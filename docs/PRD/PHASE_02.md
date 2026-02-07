# Phase 2: Pre-Event Setup

**Dependencies:** Phase 1 (All stores and services)
**Status:** Pending

| Requirement ID | Description                 | User Story                                                                                        | Expected Behavior/Outcome                                                                                                                          |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P2-REQ-001** | Question Management Page    | As a host, I need a page to manage question sets so that I can prepare questions before the event | - Navigate to /questions<br>- See uploaded sets list<br>- Upload, view, delete operations<br>- Responsive layout                                   |
| **P2-REQ-002** | Question Uploader Component | As a host, I need to upload JSON files so that question sets are stored locally                   | - Drag & drop or file picker<br>- Real-time validation feedback<br>- Progress indicator<br>- Success/error messages<br>- Supports multiple uploads |
| **P2-REQ-003** | Question Set List Component | As a host, I need to see all uploaded question sets so that I can verify preparation              | - Card layout with set details<br>- Set name, question count, upload date<br>- Actions: View, Delete, Export<br>- Empty state with upload prompt   |
| **P2-REQ-004** | Question Set Viewer         | As a host, I need to preview question sets so that I can verify content quality                   | - Modal with question list<br>- Show: text, options, correct answer<br>- Navigate through questions<br>- Close without saving                      |
| **P2-REQ-005** | Question Set Deletion       | As a host, I need to delete incorrect question sets so that only valid sets remain                | - Confirmation dialog<br>- Remove from localStorage<br>- Update UI immediately<br>- Cannot delete if assigned to team                              |
| **P2-REQ-006** | Team Configuration Page     | As a host, I need to configure teams before the event so that team data is ready                  | - Navigate to /teams/config<br>- Add team form<br>- Team list view<br>- Edit/delete teams                                                          |
| **P2-REQ-007** | Add Team Form               | As a host, I need to add teams with details so that participant information is captured           | - Fields: Team name, participants, contact<br>- Validation (required fields)<br>- Save to Firebase<br>- Clear form after save                      |
| **P2-REQ-008** | Team Configuration List     | As a host, I need to see configured teams so that I can verify setup                              | - Card grid layout<br>- Show: name, participants, status<br>- Actions: Edit, Delete<br>- Empty state guide                                         |
| **P2-REQ-009** | Edit Team                   | As a host, I need to edit team details so that I can correct mistakes                             | - Pre-fill form with existing data<br>- Update Firebase on save<br>- Real-time sync across tabs<br>- Validation before save                        |
| **P2-REQ-010** | Delete Team                 | As a host, I need to remove teams so that only participating teams remain                         | - Confirmation dialog<br>- Remove from Firebase<br>- Cannot delete if game started<br>- Update UI immediately                                      |
| **P2-REQ-011** | Setup Verification View     | As a host, I need to verify complete setup so that I know everything is ready                     | - Summary: X teams, Y question sets<br>- Validation checks with status<br>- Warning for incomplete setup<br>- "Ready" badge when complete          |

**Phase 2 Acceptance Criteria:**

- ✅ Can upload valid question sets successfully
- ✅ Invalid JSON shows clear error messages
- ✅ Can add/edit/delete teams before game starts
- ✅ Setup verification accurately reflects readiness
- ✅ All data persists correctly (localStorage + Firebase)
