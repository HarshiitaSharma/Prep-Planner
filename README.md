# Prep. 📝

A competitive exam planner styled like graph paper and an OMR sheet. Works
for any exam (JEE, NEET, UPSC, GATE, CAT, banking, SSC...) because you
define the subjects and topics yourself.

No build step, no dependencies, no backend: `index.html`, `styles.css`,
`script.js`. Data is saved in your browser's `localStorage`.

## Features

- **Countdown** to your exam date, with the number of topics per week you
  need to finish on time (the last ~20% of the time, up to 14 days, is
  reserved for revision)
- **Syllabus tracker**: subjects and topics, each topic an OMR-style bubble
  you fill in when done, with per-subject progress bars
- **Quick-start subject sets** for JEE, NEET, UPSC, Banking/SSC and CAT
  (subject names only, add your own topics)
- **Study log**: add time with one tap, daily target, 14-day bar chart
  (green when you hit the target) and a streak counter
- **Mock test tracker**: log score and total, see a trend chart, average
  and best percentage
- **Backup**: export everything as JSON and import it on another device

## Running it

Open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Putting it on GitHub

```bash
git init
git add .
git commit -m "Prep: a competitive exam planner"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Free hosting with GitHub Pages

1. Push the repo.
2. **Settings → Pages → Source → Deploy from a branch**, choose `main` and
   `/ (root)`.
3. Live at `https://<your-username>.github.io/<repo-name>/`.

Note: `localStorage` is per-browser and per-device. Use Export/Import to
move your data between devices.

## File structure

```
prep-planner/
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Ideas to extend it

- Per-topic weightage (High/Med/Low) and a smarter pace calculation
- Spaced-repetition revision reminders (1, 3, 7, 21 days after finishing a topic)
- Track mistakes per mock test by subject
- Pomodoro timer that logs straight into the study log
- Multiple exams, switchable from a dropdown
