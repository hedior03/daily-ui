# Gym Workout Template

Generate a detailed workout plan for the specified day using Astro MDX components.

## Required Components
- `<WorkoutSection title="...">`
- `<ExerciseCard name="..." sets="..." reps="..." rpe="..." rest="..." />`
- `<SectionCheck id="..." label="..." storageKey="..." client:load />`
- `<FormCue label="...">...</FormCue>`
- `<MuscleGroups groups={["..."]} />`

## Guidelines
- Standard Markdown for text, bolding, and lists.
- JSX components for interactivity and structured data.
- Ensure the frontmatter includes `title`, `date`, `category`, and `tenant`.
- ALWAYS include these exact imports at the top (after frontmatter):
  ```mdx
  import WorkoutSection from "../../../src/components/gym/WorkoutSection.astro";
  import ExerciseCard from "../../../src/components/gym/ExerciseCard.astro";
  import SectionCheck from "../../../src/components/gym/SectionCheck.tsx";
  import FormCue from "../../../src/components/gym/FormCue.astro";
  import MuscleGroups from "../../../src/components/gym/MuscleGroups.astro";
  ```

## Prompt Context
The following sections provide the tenant's persona and specific training goals. Use them to tailor the workout.
