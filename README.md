# LegalPath

LegalPath is a Vietnamese legal-information project with public search, user, legal-expert, and administrator areas.

## Run locally

Requires Node.js 18 or newer. No third-party packages are needed.

```powershell
$env:BOOTSTRAP_ADMIN_IDENTITY = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "Set-A-Unique-Password-Here"
node server.js
```

Set both bootstrap variables only when creating the first administrator. Use a unique password of at least 12 characters; do not store real credentials in source control. The server creates the administrator only when that identity is not already present.

Open `http://localhost:3001/` to use the Node server with shared JSON data and server-managed sessions.

To use VS Code Live Server and save changes to JSON files, run `node server.js` in a separate terminal as well. Live Server serves the pages; the Node server handles API requests and writes data to disk. If the Node server is not running, the site displays an API connection error instead of saving accounts only in browser storage.

## Project structure

```text
index.html
css/
  global.css
  responsive.css
  pages/                 # Page-specific CSS and responsive styles
js/
  api.js                 # Shared API client
  main.js                # Shared session and UI behavior
  pages/                 # Role-specific behavior
pages/
  auth/
  public/
  user/
  expert/
  admin/
data/
  users.json             # Registered accounts (passwords are hashed)
  legal.json             # Legal categories and expert directory
  legal-supplement.json  # Clearly labeled illustrative procedure records
  expert-content.json    # Articles, checklists, and expert profiles
  notifications.json     # Notification templates and user notifications
  settings.json          # System settings
  user-workspaces.json   # Per-user saved suggestions and redacted reviews
  db.json                # Legacy seed data, imported on first run
server.js                # Static site and same-origin API
docs/
```

## Data and roles

The Node server stores each data group in its own JSON file under `data/`. On first start, it imports the matching data from the legacy `data/db.json` if a split file does not exist. After migration, the split files are the source of truth; `db.json` is retained unchanged as legacy seed data. Browser pages access these files only through `js/api.js` and the Node server. Checklist progress and personal display preferences remain in browser storage.

Public registration supports `user` and `legal_expert`; administrator accounts must be bootstrapped using the environment variables above. Passwords are stored as salted scrypt hashes. Login sessions are HttpOnly cookies held in server memory and expire after eight hours; restarting the local server signs users out.

The imported user and admin pages retain their page-specific styles and scripts to preserve their existing layouts. Shared tokens, controls, API access, and role checks live in the root `css/` and `js/` directories.

## Local assistance and sample data

The public search and signed-in user search support combined keyword, category, and fee filters, plus alphabetical sorting. The user workspace includes an explainable, local rule-based procedure recommender and preliminary checklist-risk review. The expert article editor can draft a generic outline from a topic and an existing checklist. These helpers do not call an external LLM or send case text outside the app; they are not legal advice and must not invent or verify legal rules. A user must review and explicitly save a suggestion or draft.

Accepted procedure suggestions and risk-review summaries are stored per signed-in user in `data/user-workspaces.json`. Risk-review history stores only the selected procedure, a rule-based level, and reason codes—not the text entered for analysis. Additional procedure records in `data/legal-supplement.json` are marked as illustrative; verify all current requirements with an official source before relying on them.
