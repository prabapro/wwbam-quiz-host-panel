# Product Requirements Document (PRD)

## Quiz Competition Host Panel

---

- **Document Version:** 1.0
- **Last Updated:** February 07, 2026
- **Project:** WWBAM Quiz Host Panel
- **Development Approach:** Sequential Phased Development

---

## Phases

1. [Phase 1: Foundation & Data Management](PHASE_01.md)
2. [Phase 2: Pre-Event Setup](PHASE_02.md)
3. [Phase 3: Game Initialization](PHASE_03.md)
4. [Phase 4: Core Game Play - Question Flow](PHASE_04.md)
5. [Phase 5: Team Management & Lifelines](PHASE_05.md)
6. [Phase 6: UI/UX Polish & Prize Tracking](PHASE_06.md)
7. [Phase 7: Edge Cases & Game Management](PHASE_07.md)
8. [Phase 8: Post-Game & Analytics](PHASE_08.md)
9. [Phase 9: Testing & Optimization](PHASE_09.md)
10. [Phase 10: Documentation & Deployment](PHASE_10.md)

---

## Project Overview

### Goal

Build a real-time quiz competition host panel for managing multiple teams competing in a "Who Wants to Be a Millionaire" style game format.

### Success Criteria

- Host can manage 7-10 teams through 20 questions each
- Real-time synchronization between host panel and public display
- Secure question management (localStorage + Firebase)
- Zero question leakage to public
- Smooth game flow with minimal host intervention

### Technical Stack

- Frontend: React 19 + Vite
- State: Zustand
- Database: Firebase Realtime Database
- Storage: Browser localStorage (questions)
- Styling: Tailwind CSS 4

## Appendix

### A. Requirement Categories

| Category            | Prefix  | Examples                             |
| ------------------- | ------- | ------------------------------------ |
| Foundation          | P1-REQ  | Stores, services, utilities          |
| Pre-Event Setup     | P2-REQ  | Team config, question upload         |
| Game Initialization | P3-REQ  | Shuffle, assign, start               |
| Core Gameplay       | P4-REQ  | Questions, answers, validation       |
| Team Management     | P5-REQ  | Lifelines, eliminations, transitions |
| UI/UX               | P6-REQ  | Animations, toasts, layouts          |
| Edge Cases          | P7-REQ  | Pause, errors, confirmations         |
| Post-Game           | P8-REQ  | Results, export, reset               |
| Testing             | P9-REQ  | E2E, integration, performance        |
| Documentation       | P10-REQ | Guides, deployment, support          |

### B. Priority Levels

- **P0 (Critical):** Must-have for MVP - Phases 1-5
- **P1 (High):** Important for good UX - Phases 6-7
- **P2 (Medium):** Nice to have - Phase 8
- **P3 (Low):** Can defer post-launch - Phases 9-10

### C. Success Metrics

| Metric           | Target                                            |
| ---------------- | ------------------------------------------------- |
| Page Load Time   | <2 seconds                                        |
| Lighthouse Score | >90                                               |
| Bundle Size      | <500KB initial                                    |
| Test Coverage    | >80%                                              |
| Accessibility    | WCAG AA compliant                                 |
| Browser Support  | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile Support   | iOS 14+, Android 10+                              |
| Uptime           | 99.9%                                             |

### D. Dependencies Map

```
Phase 1 (Foundation)
    ↓
Phase 2 (Setup) ← Phase 3 (Init)
    ↓                ↓
    └────→ Phase 4 (Core Play)
              ↓
         Phase 5 (Teams/Lifelines)
              ↓
         Phase 6 (UI Polish)
              ↓
         Phase 7 (Edge Cases)
              ↓
         Phase 8 (Post-Game)
              ↓
         Phase 9 (Testing)
              ↓
         Phase 10 (Deploy)
```

### E. Change Log

| Version | Date       | Changes             | Author                                   |
| ------- | ---------- | ------------------- | ---------------------------------------- |
| 1.0     | 2026-02-07 | Initial PRD created | [@prabapro](https://github.com/prabapro) |

---

**End of Document**
