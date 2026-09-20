#!/bin/zsh
set -e
cd "${0:A:h}"
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
if [[ -x "$runtime/node" ]]; then
  export PATH="$runtime:$PATH"
fi
exec npm run dev -- --port 5173 --strictPort
