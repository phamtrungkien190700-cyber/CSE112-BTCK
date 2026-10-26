# JSON Server APIs

The API data is split by resource. Start each command in a separate terminal
from the repository root:

```powershell
Copy-Item api\users.example.json api\users.json
json-server api/users.json --port 3000
json-server api/legal-procedures.json --port 3001
json-server api/experts.json --port 3002
json-server api/expert-content.json --port 3003
```

Pages that use the same resource share its API:

- `users.json`: `http://localhost:3000/list-user`
- `legal-procedures.json`: `http://localhost:3001/list-luat`
- `experts.json`: `http://localhost:3002/experts_directory`
- `expert-content.json`: `http://localhost:3003/expert_content/portal` (bài viết và checklist)
- `expert-content.json`: `http://localhost:3003/notifications` (thông báo)

The user AI assistant loads procedure categories from
`http://localhost:3001/list-luat`. Saved recommendations and risk-review
metadata are kept in browser storage for the signed-in account (or a guest
workspace when signed out); situation text is not saved.

The settings page appends account-specific notifications to the `notifications`
collection in `expert-content.json`. Each notification is associated with the
signed-in user's ID and role; the notifications page only displays records for
that account and role.

`api/users.json` is a local database and is excluded from Git because it can
contain account credentials and personal data. Create it from
`api/users.example.json` before starting the users API.

The settings page uses the logged-in user's ID to load
`GET /list-user/{id}` and saves profile name and login identity with
`PATCH /list-user/{id}`. A successful login stores only the user's ID,
identity, and role in browser storage; the password is not stored there.

The expert profile page reads the `EXP-01` record from `/experts_directory` and
updates that record with `PATCH /experts_directory/{id}`. Article and checklist
pages continue to use `expert-content.json`.

The editor review queue reads checklists from
`GET /expert_content/portal`. Draft checklists are shown as awaiting review;
approval sets `status` to `published` and `reviewStatus` to `approved`, while
rejection keeps the checklist as a draft and sets `reviewStatus` to `rejected`.
Both actions save the updated portal record back to the same endpoint.

The expert article-management page lists both articles and checklists from this
record. Checklist status is shown as awaiting review until approved, then as
published; rejected checklists are labeled as rejected. Saving a checklist
after editing sends it back to the review queue.

Bật api 
npx --yes json-server@0.17.4 api\users.json --host 127.0.0.1 --port 3000
npx --yes json-server@0.17.4 api\legal-procedures.json --host 127.0.0.1 --port 3001
npx --yes json-server@0.17.4 api\experts.json --host 127.0.0.1 --port 3002
npx --yes json-server@0.17.4 api\expert-content.json --host 127.0.0.1 --port 3003