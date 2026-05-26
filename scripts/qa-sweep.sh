#!/usr/bin/env bash
# QA sweep across every stacked PR branch: build + headless check.
cd "$(dirname "$0")/.." || exit 1
echo "branch | build | qa_exit | errors"
echo "-------|-------|---------|-------"
for b in $(git branch --list 'claude/viz-*' --format='%(refname:short)' | sort -t- -k2 -n); do
  git checkout -q "$b" 2>/dev/null
  if npm run build >/tmp/qa-b.log 2>&1; then BUILD=OK; else BUILD=FAIL; fi
  sleep 4
  URL=http://localhost:5173/ node scripts/check.mjs >/tmp/qa-c.json 2>&1
  QX=$?
  ERRS=$(python3 -c "import json;d=json.load(open('/tmp/qa-c.json'));print(len(d.get('errors',[])))" 2>/dev/null || echo "?")
  printf "%s | %s | %s | %s\n" "$b" "$BUILD" "$QX" "$ERRS"
done
git checkout -q claude/viz-26-readme 2>/dev/null
echo "SWEEP DONE"
