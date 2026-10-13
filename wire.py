#!/usr/bin/env python3
"""Run once from the repo root: wires the add-on files into index.html and README.md."""
p = 'index.html'; s = open(p).read()
if 'addons.css' not in s:
    s = s.replace('<link rel="stylesheet" href="styles.css">',
        '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="addons.css">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1B2559">')
    s = s.replace('<script src="script.js"></script>',
        '<script src="script.js"></script>\n<script src="pomodoro.js"></script>\n<script src="revision.js"></script>\n'
        '<script src="insights.js"></script>\n<script src="csv-export.js"></script>\n<script src="pwa.js"></script>')
    open(p, 'w').write(s)
r = open('README.md').read()
if '## Extras' not in r:
    r = r.replace('## Running it', '''## Extras

- **Focus timer**: finished sessions are added to the study log automatically
- **Revise today**: spaced-repetition reminders (1, 3, 7, 21 days) for topics you finish
  (only topics ticked off after this feature was added are tracked)
- **Insights**: weekly study time, target days hit, mock trend, least-covered subject
- **CSV export** for mock tests and the study log
- **Installable PWA** that works offline; GitHub Actions deploys to Pages on push

## Running it''', 1)
    r = r.replace('├── styles.css\n├── script.js\n└── README.md',
        '├── styles.css / addons.css\n├── script.js\n├── pomodoro.js / revision.js / insights.js / csv-export.js\n'
        '├── pwa.js / sw.js / manifest.webmanifest / icon.svg\n├── .github/workflows/pages.yml\n└── README.md')
    open('README.md', 'w').write(r)
print('wired')
