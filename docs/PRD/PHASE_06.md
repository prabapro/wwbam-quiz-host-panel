# Phase 6: UI/UX Polish & Prize Tracking

- **Dependencies:** Phase 5 (Core features complete)
- **Status:** Pending
- **USER_JOURNEY Reference:** [Journey 4: Real-Time Dashboard View](../USER_JOURNEY.md#real-time-dashboard-view)

| Requirement ID | Description                 | User Story                                                                        | Expected Behavior/Outcome                                                                                                                                                                                            |
| -------------- | --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P6-REQ-001** | Prize Ladder Component      | As a host/audience, I need to see prize values so that stakes are clear           | - Visual ladder from min to max prize (prize-structure)<br>- Highlight current level (yellow/gold)<br>- Milestone markers (MILESTONE_QUESTIONS)<br>- Responsive design (mobile/desktop)<br>- Animate on level change |
| **P6-REQ-002** | Status Bar Component        | As a host, I need status overview so that I see game state at a glance            | - Top bar with: Active team, Question #, Prize, Timer<br>- Color-coded game status indicator<br>- Live updates<br>- Sticky positioning<br>- Mobile responsive                                                        |
| **P6-REQ-003** | Current Prize Display       | As a host/team, I need to see prize amounts so that teams know their winnings     | - Large, prominent display<br>- Format with commas (Rs.1,000,000)<br>- Update animation on correct answer<br>- Color: green for increase<br>- Freeze on elimination                                                  |
| **P6-REQ-004** | Toast Notification System   | As a host, I need feedback messages so that I know actions succeeded              | - Success: green toast, auto-dismiss<br>- Error: red toast, manual dismiss<br>- Warning: yellow toast<br>- Info: blue toast<br>- Position: top-right<br>- Stack multiple toasts                                      |
| **P6-REQ-005** | Toast for Key Events        | As a host, I need notifications for important events so that I stay informed      | - Team eliminated: "Team X eliminated - Rs.Y"<br>- Team completed: "Team X won Rs.Z!"<br>- Lifeline used: "Phone-a-Friend activated"<br>- Question loaded: "Question ready"<br>- Connection lost/restored            |
| **P6-REQ-006** | Loading States              | As a user, I need loading indicators so that I know system is working             | - Spinner for Firebase operations<br>- Skeleton for team cards loading<br>- Button loading state (disabled + spinner)<br>- Page loader for navigation<br>- "Saving..." text feedback                                 |
| **P6-REQ-007** | Transition Animations       | As a user, I need smooth animations so that UI feels polished                     | - Fade in/out for questions<br>- Slide in for team cards<br>- Scale for correct answer<br>- Shake for incorrect (subtle)<br>- Confetti for completion<br>- Duration: 300-500ms                                       |
| **P6-REQ-008** | Button State Management     | As a developer, I need consistent button states so that UX is predictable         | - Default: enabled, full color<br>- Hover: darker/lighter shade<br>- Active: pressed effect<br>- Disabled: greyed out, cursor not-allowed<br>- Loading: spinner + disabled                                           |
| **P6-REQ-009** | Responsive Layout           | As a user, I need mobile support so that I can use any device                     | - Dashboard: single column on mobile<br>- Team cards: stack vertically<br>- Prize ladder: horizontal scroll or collapse<br>- Controls: touch-friendly (48px min)<br>- Test on phone/tablet                           |
| **P6-REQ-010** | Color Coding System         | As a user, I need visual cues so that I understand status quickly                 | - Active: Blue (#3B82F6)<br>- Waiting: Grey (#9CA3AF)<br>- Eliminated: Red (#EF4444)<br>- Completed: Green (#10B981)<br>- Correct answer: Green<br>- Incorrect answer: Red<br>- Selected answer: Yellow              |
| **P6-REQ-011** | Dark Mode Support           | As a user, I need dark mode so that I can use in low-light conditions             | - All components support dark theme<br>- Proper contrast ratios (WCAG AA)<br>- Theme toggle persistence<br>- Smooth theme transition<br>- Test all states in dark mode                                               |
| **P6-REQ-012** | Accessibility Improvements  | As a user with disabilities, I need accessible UI so that I can operate the panel | - Keyboard navigation (tab order)<br>- ARIA labels for buttons<br>- Focus indicators (visible)<br>- Screen reader announcements<br>- Color not sole indicator                                                        |
| **P6-REQ-013** | Empty States                | As a user, I need helpful empty states so that I know what to do next             | - No teams: "Add teams to get started"<br>- No questions: "Upload question sets"<br>- Game not started: "Initialize game"<br>- No active team: "Start event"<br>- Include action button                              |
| **P6-REQ-014** | Connection Status Indicator | As a user, I need connection status so that I know if data is syncing             | - Green dot: connected<br>- Red dot: disconnected<br>- Yellow dot: reconnecting<br>- Position: header or status bar<br>- Tooltip with details                                                                        |

**Phase 6 Acceptance Criteria:**

- ✅ All animations smooth and performant
- ✅ Toast notifications appear for all key events
- ✅ Prize ladder highlights correct level
- ✅ Mobile layout is usable (tested)
- ✅ Dark mode works across all components
- ✅ Accessibility: keyboard nav + screen reader friendly
