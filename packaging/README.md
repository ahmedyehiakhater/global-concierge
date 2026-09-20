# Windows x64 distribution

The ready-to-extract ZIP is tracked in `releases/Global-Concierge-Windows-x64.zip`.
The expanded build folder is ignored. Visitor data, logs and installed dependencies
are excluded from version control and the deliverable.

## Rebuild on the Mac

Use Node 22.13+ and Python 3. From the repository root:

```sh
npm ci
npm test
npm run build
curl -fL https://nodejs.org/dist/v22.23.2/node-v22.23.2-win-x64.zip -o /tmp/gc-node-win-x64.zip
python3 packaging/package-windows.py
```

The script verifies the pinned official runtime ZIP checksum and the PE x64
architecture, copies the compiled assets and backend, includes licenses, and
produces a per-file SHA-256 manifest. It never copies `data/`. Updating Node
requires updating the version and verified checksum in the packaging script.

The production server binds only to 127.0.0.1:8787. Start detects this package's
server using a per-run control token; Stop asks that server to close gracefully.
It never kills an arbitrary process. Port conflicts are reported in data/server.log.
GC_PORT, GC_DATA_DIR and GC_NO_BROWSER are optional developer test overrides.

Mac verification covers the compiled browser UI, API/SQLite, static-file isolation,
start/stop controller, archive persistence and ZIP integrity. Windows .cmd launch,
node.exe execution, corporate policy and GPU/browser behaviour must be checked
on the actual Windows laptop.
