#!/usr/bin/env bash
# Smoke test for create-oliang: scaffolds every combo, checks structure,
# installs, builds, boots the server, and hits the main endpoints.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="$ROOT/packages/create-oliang/index.js"
WORK="$(mktemp -d)"
PASS=0
FAIL=0
FAILURES=()

ok()  { PASS=$((PASS + 1)); echo "  ok   $1"; }
bad() { FAIL=$((FAIL + 1)); FAILURES+=("$2: $1"); echo "  FAIL $1"; }

check() { # check <combo> <description> <exit code>
  if [ "$3" -eq 0 ]; then ok "$2"; else bad "$2" "$1"; fi
}

wait_for() { # wait_for <url> — up to ~9s
  for _ in $(seq 1 30); do
    curl -sf -m 2 "$1" > /dev/null 2>&1 && return 0
    sleep 0.3
  done
  return 1
}

structure_checks() { # structure_checks <combo> <dir> <starter> <expect_http>
  local combo="$1" dir="$2" starter="$3" expect_http="$4"

  [ "$(find "$dir" -name "_gitkeep" | wc -l)" -eq 0 ]
  check "$combo" "no leftover _gitkeep" $?

  [ -f "$dir/.gitignore" ] && [ -f "$dir/.env" ] && [ -f "$dir/.env.example" ]
  check "$combo" "dotfiles restored" $?

  grep -q "\"name\": \"$combo\"" "$dir/package.json"
  check "$combo" "package name set" $?

  if [ "$expect_http" = "yes" ]; then
    [ -f "$dir/http/health.http" ] && [ -f "$dir/http/http-client.env.json" ]
    check "$combo" "http/ folder present" $?
  else
    [ ! -d "$dir/http" ]
    check "$combo" "http/ folder absent (--no-http)" $?
  fi

  if [ "$starter" = "example" ]; then
    grep -q '"zod"' "$dir/package.json"
    check "$combo" "zod merged into dependencies" $?
    [ -f "$dir/http/users.http" ]
    check "$combo" "users.http present" $?
  fi
}

runtime_checks() { # runtime_checks <combo> <dir> <lang> <starter> <port>
  local combo="$1" dir="$2" lang="$3" starter="$4" port="$5" entry pid base

  (cd "$dir" && npm install --no-audit --no-fund > /dev/null 2>&1)
  check "$combo" "npm install" $?

  if [ "$lang" = "ts" ]; then
    (cd "$dir" && npm run build > /dev/null 2>&1)
    check "$combo" "tsc build" $?
    entry="dist/index.js"
  else
    entry="src/index.js"
  fi

  (cd "$dir" && PORT="$port" node "$entry" > /dev/null 2>&1) &
  pid=$!
  base="http://localhost:$port"

  wait_for "$base/health"
  check "$combo" "server boots, GET /health" $?

  if [ "$starter" = "example" ]; then
    curl -sf -m 5 -X POST "$base/api/users" \
      -H "Content-Type: application/json" \
      -d '{"name":"Smoke","email":"smoke@test.dev"}' \
      | grep -q "User created successfully"
    check "$combo" "POST /api/users creates" $?

    curl -sf -m 5 "$base/api/users" | grep -q "smoke@test.dev"
    check "$combo" "GET /api/users lists" $?

    curl -s -m 5 -X POST "$base/api/users" \
      -H "Content-Type: application/json" -d '{}' \
      | grep -q "ERROR_VALIDATION_ERROR"
    check "$combo" "invalid body returns validation error" $?

    curl -s -m 5 "$base/api/users/nope" | grep -q "ERROR_NOT_FOUND"
    check "$combo" "unknown id returns 404 error code" $?
  fi

  kill "$pid" > /dev/null 2>&1
  wait "$pid" 2> /dev/null
}

run_combo() { # run_combo <combo> <lang> <starter> <port> <expect_http> <flags...>
  local combo="$1" lang="$2" starter="$3" port="$4" expect_http="$5"
  shift 5
  echo "== $combo =="

  (cd "$WORK" && node "$CLI" "$combo" "$@" > /dev/null 2>&1)
  check "$combo" "scaffold" $?
  [ -d "$WORK/$combo" ] || return

  structure_checks "$combo" "$WORK/$combo" "$starter" "$expect_http"

  if [ "$port" != "-" ]; then
    runtime_checks "$combo" "$WORK/$combo" "$lang" "$starter" "$port"
  fi
}

echo "workdir: $WORK"
run_combo ts-blank    ts blank   4611 yes --ts --blank
run_combo ts-example  ts example 4612 yes --ts --example
run_combo js-blank    js blank   4613 yes --js --blank
run_combo js-example  js example 4614 yes --js --example
run_combo ts-nohttp   ts blank   -    no  --ts --blank --no-http

rm -rf "$WORK"

echo
echo "passed: $PASS  failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '  - %s\n' "${FAILURES[@]}"
  exit 1
fi
echo "all smoke tests passed"
