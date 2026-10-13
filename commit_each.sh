#!/usr/bin/env bash
# From your repo root, after copying these files in. One commit per feature.
set -e
c() { m="$1"; shift; git add "$@" && git commit -m "$m"; }
python3 wire.py
c "Add .gitignore"                                  .gitignore
c "Add MIT license"                                 LICENSE
c "Add focus timer that logs into the study log"    pomodoro.js
c "Add spaced-repetition revision reminders"        revision.js
c "Add insights card"                               insights.js
c "Add CSV export for mocks and study log"          csv-export.js
c "Add add-on styles"                               addons.css
c "Add PWA manifest, icon and offline worker"       manifest.webmanifest sw.js pwa.js icon.svg
c "Add GitHub Pages deploy workflow"                .github/workflows/pages.yml
c "Add changelog"                                   CHANGELOG.md
c "Wire add-ons into index.html and README"         index.html README.md
git log --oneline | head -12
