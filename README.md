# mcquiz

A lightweight multiple-choice quiz app built with React, TypeScript, Vite, and Tailwind CSS v4.

## Development

```sh
npm install
npm run dev
```

## Adding a quiz

Add a JSON file in `src/quizzes/`. The file name becomes the quiz URL (`general-knowledge.json` is available at `/quiz/general-knowledge`).

```json
{
  "title": "A bit of everything",
  "description": "A short quiz description.",
  "category": "GENERAL KNOWLEDGE",
  "questions": [
    {
      "prompt": "Which answer is correct?",
      "options": ["First choice", "Second choice", "Third choice"],
      "answer": 1,
      "explanation": "An optional explanation shown only when the answer is revealed."
    }
  ]
}
```

`answer` is the zero-based index of the correct option. Quiz JSON files are bundled at build time, so run a new build after adding or changing a quiz. Results live only in app memory and are cleared when the page is refreshed or left.

## Build

```sh
npm run build
```
