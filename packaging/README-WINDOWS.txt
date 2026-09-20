GLOBAL CONCIERGE - WINDOWS x64 OFFLINE DEMO

1. Extract ALL files from the ZIP to a writable folder, for example
   Documents\Global Concierge Demo. Do not run it inside the ZIP.
2. Double-click Start Global Concierge.cmd.
3. Your default browser should open http://127.0.0.1:8787/opening.html
   If it does not, open this exact address in Edge or Chrome.
4. Leave the folder in place while presenting. The backend runs in the
   background; no internet, installation or development tools are required.
5. Double-click Stop Global Concierge.cmd when finished.
   Closing the browser alone does not stop the backend.

TONIGHT'S REHEARSAL
- Disconnect Wi-Fi temporarily and open the demo.
- Build Login, then New Booking. Check that the scripted booking saves.
- Build Financials and check AED 99,424 available after the AED 576 booking.
- Test Reset during a build. It should demolish the page and welcome a new visitor.
- Stop and restart the demo. The database and archived sessions remain saved.
  Starting a new ceremony intentionally creates a fresh session; the opening
  scene does not resume an unfinished animation after closing the browser.
- Check bots, dialogue, designs and artefacts in the work laptop browser.

DATA
This package starts with no database and no personal Mac demo sessions.
The first launch creates data\concierge.sqlite. Manual reset archives the old
visitor session rather than deleting it. Use sample data at the booth.
To copy saved data, STOP the demo first, then copy the entire data folder.
Keep the same folder and browser profile throughout the event.

IF IT DOES NOT START
Read data\server.log and send the error text or screenshot.
If port 8787 is occupied, stop the previous demo instance before starting.
The launchers only control the server associated with this package's token;
they do not kill other applications. Do not run multiple copies concurrently.
The server listens only on this laptop (127.0.0.1), not the booth network.
Company restrictions may block .cmd or node.exe, or localhost browser access.
Do not bypass company protections; ask IT or use an approved hosted alternative.

This is a compiled production build, not a Vite development server.
The bundled Windows executable must be tested on Windows; Mac checks do not
validate corporate Windows policies, browser support or GPU performance.
