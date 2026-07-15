#!/usr/bin/env bash
# Smoke test for create-oliang: scaffolds every combo, checks structure,
# installs, builds, boots the server, and hits the main endpoints.
# MongoDB combos are checked up to the build step (no MongoDB server needed).
# Prisma combos run full CRUD only when SMOKE_PG_URL points at a disposable
# PostgreSQL database (schema is pushed into it, test rows accumulate);
# otherwise they are checked up to boot + /health.
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

structure_checks() { # structure_checks <combo> <dir> <lang> <starter> <db> <expect_http>
  local combo="$1" dir="$2" lang="$3" starter="$4" db="$5" expect_http="$6"

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

  if [ "$db" = "prisma" ]; then
    [ -f "$dir/prisma/schema.prisma" ] && ls "$dir"/prisma.config.* > /dev/null 2>&1 \
      && ls "$dir"/src/lib/prisma.* > /dev/null 2>&1
    check "$combo" "prisma files present" $?
    grep -q '"prisma"' "$dir/package.json" && grep -q "db:push" "$dir/package.json"
    check "$combo" "prisma deps and scripts merged" $?
  fi

  if [ "$db" = "mongodb" ]; then
    ls "$dir"/src/config/db.config.* > /dev/null 2>&1
    check "$combo" "db.config present" $?
    grep -q '"mongoose"' "$dir/package.json"
    check "$combo" "mongoose merged into dependencies" $?
    grep -q "DB_URL=mongodb://localhost:27017/$combo" "$dir/.env"
    check "$combo" "DB_URL uses project name" $?
    if [ "$starter" = "example" ]; then
      ls "$dir"/src/models/user.model.* > /dev/null 2>&1
      check "$combo" "mongoose user model present" $?
    fi
  fi
}

runtime_checks() { # runtime_checks <combo> <dir> <lang> <starter> <db> <mode: build|port>
  local combo="$1" dir="$2" lang="$3" starter="$4" db="$5" mode="$6" entry pid base

  (cd "$dir" && npm install --no-audit --no-fund > /dev/null 2>&1)
  check "$combo" "npm install" $?

  local can_query="yes"
  if [ "$db" = "prisma" ]; then
    if [ -n "${SMOKE_PG_URL:-}" ]; then
      sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$SMOKE_PG_URL\"|" "$dir/.env"
      rm -f "$dir/.env.bak"
      (cd "$dir" && npx prisma db push > /dev/null 2>&1)
      check "$combo" "prisma db push" $?
    else
      can_query="no"
      echo "  skip prisma CRUD (set SMOKE_PG_URL to a disposable postgres db to enable)"
    fi
  fi

  if [ "$lang" = "ts" ]; then
    (cd "$dir" && npm run build > /dev/null 2>&1)
    check "$combo" "tsc build" $?
    entry="dist/index.js"
  else
    entry="src/index.js"
  fi

  [ "$mode" = "build" ] && return

  (cd "$dir" && PORT="$mode" node "$entry" > /dev/null 2>&1) &
  pid=$!
  base="http://localhost:$mode"

  wait_for "$base/health"
  check "$combo" "server boots, GET /health" $?

  if [ "$starter" = "example" ] && [ "$can_query" = "yes" ]; then
    curl -sf -m 30 -X POST "$base/api/users" \
      -H "Content-Type: application/json" \
      -d '{"name":"Smoke","email":"smoke@test.dev"}' \
      | grep -q "User created successfully"
    check "$combo" "POST /api/users creates" $?

    curl -sf -m 30 "$base/api/users" | grep -q "smoke@test.dev"
    check "$combo" "GET /api/users lists" $?

    curl -s -m 30 -X POST "$base/api/users" \
      -H "Content-Type: application/json" -d '{}' \
      | grep -q "ERROR_VALIDATION_ERROR"
    check "$combo" "invalid body returns validation error" $?

    curl -s -m 30 "$base/api/users/nope" | grep -q "ERROR_NOT_FOUND"
    check "$combo" "unknown id returns 404 error code" $?
  fi

  # kill the node child too — killing only the backgrounded subshell leaks it
  pkill -P "$pid" > /dev/null 2>&1
  kill "$pid" > /dev/null 2>&1
  wait "$pid" 2> /dev/null
}

run_combo() { # run_combo <combo> <lang> <starter> <db> <mode: -|build|port> <expect_http> <flags...>
  local combo="$1" lang="$2" starter="$3" db="$4" mode="$5" expect_http="$6"
  shift 6
  echo "== $combo =="

  (cd "$WORK" && node "$CLI" "$combo" "$@" > /dev/null 2>&1)
  check "$combo" "scaffold" $?
  [ -d "$WORK/$combo" ] || return

  structure_checks "$combo" "$WORK/$combo" "$lang" "$starter" "$db" "$expect_http"

  if [ "$mode" != "-" ]; then
    runtime_checks "$combo" "$WORK/$combo" "$lang" "$starter" "$db" "$mode"
  fi
}

echo "workdir: $WORK"

# free our test ports in case a previous run leaked a server
for port in 4611 4612 4613 4614 4615 4616; do
  stale=$(lsof -ti "tcp:$port" 2> /dev/null)
  [ -n "$stale" ] && kill $stale > /dev/null 2>&1
done

run_combo ts-blank      ts blank   none    4611  yes --ts --blank --no-db
run_combo ts-example    ts example none    4612  yes --ts --example --no-db
run_combo js-blank      js blank   none    4613  yes --js --blank --no-db
run_combo js-example    js example none    4614  yes --js --example --no-db
run_combo ts-nohttp     ts blank   none    -     no  --ts --blank --no-db --no-http
run_combo ts-ex-prisma  ts example prisma  4615  yes --ts --example --prisma
run_combo js-ex-prisma  js example prisma  4616  yes --js --example --prisma
run_combo ts-ex-mongo   ts example mongodb build yes --ts --example --mongodb
run_combo js-blank-mongo js blank  mongodb build yes --js --blank --mongodb

rm -rf "$WORK"

echo
echo "passed: $PASS  failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '  - %s\n' "${FAILURES[@]}"
  exit 1
fi
echo "all smoke tests passed"
