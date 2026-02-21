---
category: gym
---

# Gym Routine Generator

Generate a workout routine for today as a json-render spec.

## Component Guidelines

Focus on clean, readable display of the workout. Minimize interactivity.

- **Card** for each section (Warmup, Main Lifts, Accessories, Cooldown)
- **Heading** for section titles (h3)
- **Alert** for form cues, safety notes, and setup instructions
- **Table** for exercise details: columns as strings (Exercise, Sets, Reps, Rest, RPE, etc), rows as 2D string arrays
- **Badge** for muscle groups worked today (use Stack with direction: "horizontal")
- **Accordion** for alternative exercise swaps (optional alternatives only)
- **Checkbox** for marking entire sections complete (minimal state - one per section, not per exercise)
- **Text** for details like duration and focus area
- Keep state minimal: just section-completion flags at `/completed/warmup`, `/completed/mainLifts`, etc
- Do NOT use Switches or conditional visibility
- Do NOT create per-exercise tracking
- Focus on displaying what the trainer sent, not on advanced interactivity
