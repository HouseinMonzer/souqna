#!/usr/bin/env bash
# Starts or stops a throwaway local Postgres for the API test suite.
#   ./scripts/test-db.sh start   → prints the TEST_DATABASE_URL to export
#   ./scripts/test-db.sh stop
# CI provides its own Postgres service and sets TEST_DATABASE_URL directly.
set -euo pipefail

PORT="${TEST_PG_PORT:-54329}"
DATA_DIR="${TEST_PG_DIR:-${TMPDIR:-/tmp}/souqna-test-pg}"
BIN_DIR="$(dirname "$(ls -d /usr/lib/postgresql/*/bin/pg_ctl 2>/dev/null | sort -V | tail -1)" 2>/dev/null || true)"
PG_CTL="${BIN_DIR:+$BIN_DIR/}pg_ctl"
INITDB="${BIN_DIR:+$BIN_DIR/}initdb"

run() {
  if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi
}

case "${1:-}" in
  start)
    if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
      mkdir -p "$DATA_DIR"
      if [ "$(id -u)" = "0" ]; then chown postgres "$DATA_DIR"; fi
      run "$INITDB" -D "$DATA_DIR" -U souqna --auth=trust >/dev/null
    fi
    run "$PG_CTL" -D "$DATA_DIR" -o "-p $PORT -k $DATA_DIR" -l "$DATA_DIR/server.log" -w start >/dev/null
    run psql -h "$DATA_DIR" -p "$PORT" -U souqna -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='souqna_test'" | grep -q 1 \
      || run psql -h "$DATA_DIR" -p "$PORT" -U souqna -d postgres -c "CREATE DATABASE souqna_test" >/dev/null
    echo "export TEST_DATABASE_URL=postgresql://souqna@localhost:$PORT/souqna_test"
    ;;
  stop)
    run "$PG_CTL" -D "$DATA_DIR" -m fast stop >/dev/null && echo "stopped"
    ;;
  *)
    echo "usage: $0 start|stop" >&2
    exit 1
    ;;
esac
