# Well Baked — local run & preview guide

## Reproduce uncommitted artifacts

None required. `node_modules` is already installed in `C:\bakery` (express,
pdfkit, pg). There are no `.env` files; the app reads optional env vars
(`PORT`, `DATABASE_URL`, `ADMIN_PASSCODE`, `WHATSAPP_*`) directly.

Note: this machine's environment sets `PORT=0`, which makes `server.js`
bind to a random ephemeral port — always pass an explicit port when
starting the server (see below).

## Run the server

```powershell
powershell -NoProfile -Command "$env:PORT='3000'; $p = Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory 'C:\bakery' -RedirectStandardOutput 'C:\bakery\.freebuff\preview.log' -RedirectStandardError 'C:\bakery\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru; $p.Id"
```

- The server listens on port 3000 (set via `$env:PORT` before Start-Process;
  Start-Process children inherit it).
- Detached via `-WindowStyle Hidden -PassThru`; it survives the conversation.
- Confirm with: `curl http://127.0.0.1:3000/api/health` →
  `{"ok":true,"databaseConfigured":false,"catalogStore":"file"}` locally
  (no DATABASE_URL locally; on Render with the database it says `"database"`).
- Storefront: `http://127.0.0.1:3000/` · Admin: `http://127.0.0.1:3000/admin`
  (default passcode `owner123`).
- Kill with: the PID written to stdout, or
  `Get-Process node | Stop-Process` (careful: kills all node).
