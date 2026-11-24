# COMPUTE implementation checklist

`curriculum-coverage.json` is the scope and status manifest. A complete lesson in the manifest is published with theory, a lab, reference and a knowledge check. A module remains partial whenever one of its planned chapters is outstanding.

- [x] Design a 24-domain prerequisite sequence and a buildless static architecture.
- [x] Implement navigation, a prerequisite graph, three explanation depths, local goals and progress, theme, reading mode, notes, bookmarks, glossary and import/export.
- [x] Write and illustrate 39 published lessons. Every roadmap domain has an entry lesson.
- [x] Implement 38 working labs and 51 assessment items, with reusable feedback, hints and retry.
- [x] Implement missed-question prioritization, scheduled review, module assessments and cumulative practice.
- [x] Validate curriculum integrity, representative numerical cases and persistence logic with automated tests. Check representative browser flows.
- [ ] Write the remaining 33 planned lessons with their own complete theory, references and assessments.
- [ ] Expand the circuit construction tools beyond configurable NAND networks. Expand the toy assembly, pipeline, network and database labs toward full trace models.
- [ ] Add richer lesson-specific advanced readings, an expanded glossary and more assessment depth for each chapter.
- [ ] Push the complete project to the requested GitHub repository. The connected API exposes repository reads and edits to existing repositories. The repository creation UI requires sign-in.

## Design decisions

Learning data is local to the browser. The course does not gate content on prerequisites and does not require an AI service. Original technical explanations cite course material or specifications. Labs explicitly state model boundaries where they simplify a commercial implementation.
