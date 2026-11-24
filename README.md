# COMPUTE

An interactive, self-paced course on how computers work, starting with electric charge and continuing through logic, processors, operating systems, languages, GPUs and modern AI.

This release contains **39 lessons, 38 interactive labs and 51 assessment items** across 24 curriculum domains. The roadmap plans 72 chapters. The remaining 33 chapters are marked planned. The [coverage manifest](curriculum-coverage.json) records the exact state of each chapter, and the [implementation checklist](IMPLEMENTATION.md) records limitations and next work.

## Run locally

Use Python 3 or any static HTTP file server. JavaScript modules need an HTTP origin.

```sh
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080 and choose **Start with electrons**. No accounts, packages, API keys or paid services are required by the app. The static directory can also be used with any ordinary static hosting service.

Use Node.js 20 or later to run the tests and regenerate the coverage manifest.

```sh
npm run coverage
npm test
```

## Architecture

| File | Responsibility |
| --- | --- |
| `dist/index.html` and `dist/style.css` | HTML shell, responsive layout, themes and accessible control styling |
| `dist/app.mjs` | Hash routing, rendering, lab controls and assessment interaction |
| `dist/content/roadmap.mjs` | Topologically ordered modules, recommended prerequisites and chapters |
| `dist/content/*.mjs` | Original lessons, references, glossary and exercises |
| `dist/labs.mjs` | Pure teaching models evaluated from parameters and step index |
| `dist/learning.mjs` | Import validation, scoring and review scheduling |
| `tests/course.test.mjs` | Curriculum integrity, lab reference traces, scoring and progress tests |
| `.openai/hosting.json` | This Site’s deployment configuration and static output directory |

The static app uses native JavaScript modules, CSS, SVG and browser storage. Hash routes resolve against the same document on any static host. Progress and notes are scoped to the browser origin. The Progress page exports a versioned JSON backup. Import replaces the local record after validating its schema and filtering retired lesson IDs.

### Content model

Each module has a stable ID, title, list of prerequisite module IDs, expected learning outcome and an ordered list of chapters. A lesson has a stable chapter-linked ID, title, objective, introduction, mechanism steps, worked example, misconception, revision summary, references, reading estimate and lab ID. A chapter can be planned independently of the lessons that are live.

Question records use an explicit type, prompt, optional choices, answer, explanation, hint and difficulty. The app supports single choice, multiple select, true/false, fill, numeric, matching and ordered sequencing. Order items are both draggable and keyboard-reorderable. The assessment engine reuses the same definitions for lessons, module assessments and cumulative practice.

Each lab declares field bounds and defaults, any stages, and a deterministic evaluation function. The function receives controls and a step index, and returns a digestible state, active stage and total steps. Simulation states are disposable. Only intentional study data is retained.

## Contributing

1. Choose a planned chapter in `curriculum-coverage.json`. Read its listed prerequisites and preserve stable IDs.
2. Consult primary documentation or course materials. Write your own explanation, and identify the simplifying assumptions of the classroom model.
3. Add the lesson in the appropriate content module and connect it to a lab. Use reference inputs with known outputs, including failure or boundary cases when applicable.
4. Add a reasoning question with an explanation that addresses the plausible wrong answers.
5. Regenerate coverage, run all tests and try the lesson with only the keyboard, at a narrow width and in both themes.

Avoid putting secrets or learner progress files into the project. Keep per-learner data local.
