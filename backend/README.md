# Weekly Report Generator & Team Dashboard — Backend

NestJS + TypeScript REST API backing the Weekly Report Generator & Team Dashboard.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | NestJS 10 (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Auth | JWT (Bearer token), bcrypt password hashing |
| Validation | class-validator / class-transformer |
| Testing | Jest (unit), Jest + Supertest (e2e) |

## Project Structure

```
src/
├── auth/        # register, login, JWT issuing
├── users/       # admin user management (invite, roles, deactivate)
├── projects/    # project/category CRUD
├── reports/     # draft CRUD, submit, versioning, workflow state machine
├── reviews/     # manager approve / request-changes action
├── manager/     # team-wide report list, team member profiles
├── dashboard/   # aggregation endpoints for charts/metrics
├── prisma/      # PrismaService (injectable PrismaClient wrapper)
└── common/      # guards, decorators, enums, filters, pagination DTO
prisma/
├── schema.prisma
└── seed.ts      # 1 manager, 5 team members, 4 projects, 17 reports across 4 weeks
test/
├── rbac.e2e-spec.ts
└── report-workflow.e2e-spec.ts
```

## 1. Installing Dependencies

```bash
cd backend
npm install
```

## 2. Setting Up the Database

This project uses PostgreSQL. The easiest option is a free [Neon](https://neon.tech) instance:

1. Create a free account at neon.tech, create a project, and copy the connection string it gives you.
2. Copy the env template and paste your connection string in:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1d
PORT=4000
FRONTEND_URL=http://localhost:3000
```

3. Generate the Prisma Client and create the tables:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Seed realistic demo data (5 team members, 1 manager, 4 projects, 17 reports across 4 weeks in mixed statuses):

```bash
npx prisma db seed
```

All seeded accounts share the password `Password123!`. See console output after seeding for the exact list of emails.

## 3. Running the Backend

```bash
npm run start:dev
```

The API runs on `http://localhost:4000`. Health check: `GET /health` (also verifies the DB connection).

## 4. Running the Frontend

See the `frontend/` folder's own README once available. In short:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend expects the backend at `http://localhost:4000` (configurable via its own `.env.local`).

## Running Tests

```bash
npm run test        # unit tests (mocked Prisma — no DB required)
npm run test:e2e    # e2e tests (needs a real DB — uses your DATABASE_URL)
npm run test:cov    # coverage report
```

## Authentication & Authorization

- JWT issued on login/register, sent as `Authorization: Bearer <token>`.
- Three roles: `TEAM_MEMBER`, `MANAGER`, `ADMIN`. Self-registration always defaults to `TEAM_MEMBER` — only an `ADMIN` can create a `MANAGER`/`ADMIN` account, via `POST /users`.
- `JwtAuthGuard` verifies the token on every protected route; `RolesGuard` + `@Roles()` enforces role restrictions; ownership checks inside each service (e.g. `ReportsService.findOneOwned`) ensure a team member can only ever see their own report data — this is enforced server-side, not just hidden in the UI.

## Report Review/Correction Workflow

```
DRAFT ──submit──▶ SUBMITTED ──approve──▶ APPROVED
                      │
                      └──request changes──▶ NEEDS_CORRECTION ──edit + resubmit──▶ SUBMITTED
```

- `ReportWorkflowService` centralizes the state machine — a report is only editable in `DRAFT` or `NEEDS_CORRECTION`.
- Every submit/resubmit creates an immutable `ReportVersion` snapshot (stored as JSON) rather than overwriting content — full history is always visible on demand via `GET /reports/:id` (versions are included in the response).
- Every `ReportReview` row links to the exact `ReportVersion` it was made against, so a comment can always be traced to what the manager actually saw.
- "Request changes" requires a comment — enforced at both the DTO validation layer and again inside `ReviewsService` (defense in depth).

## Key Design Decisions

- **Soft delete over hard delete** for both projects and users — a hard `DELETE` would either violate foreign key constraints from historical reports or silently destroy report history. Projects/users are deactivated (`isActive: false`) instead.
- **JSON snapshot for versions**, not a fully normalized per-version schema — the assignment only requires viewing a past version on demand, not a field-by-field diff, so a snapshot avoids a much heavier join-per-version schema.
- **Bearer token JWT**, not HttpOnly cookies — simpler to reason about and test (including in the live coding round) for a project of this scope; noted here as a deliberate trade-off rather than an oversight.

## API Overview

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users (admin) | `GET /users`, `POST /users`, `PATCH /users/:id/role`, `PATCH /users/:id/status` |
| Projects | `GET/POST /projects`, `PATCH/DELETE /projects/:id`, `GET/PUT /projects/:id/members` |
| Reports | `POST /reports`, `GET /reports/me`, `GET/PATCH /reports/:id`, `POST /reports/:id/submit` |
| Reviews | `POST /reports/:id/review` |
| Manager | `GET /manager/reports`, `GET /manager/team`, `GET /manager/team/:id` |
| Dashboard | `GET /dashboard/summary`, `/submission-status`, `/task-trends`, `/workload`, `/time-distribution`, `/activity`, `/section-view` |
| AI (manager-only, needs `ANTHROPIC_API_KEY`) | `GET /ai/team-summary`, `POST /ai/chat` |

## Assign Members to Projects

`GET /projects/:id/members` is open to any authenticated user (read); `PUT /projects/:id/members` (manager/admin) replaces the full member set in one transaction — the request body is "here is exactly who should be assigned now," not an incremental add/remove, which matches how a checklist UI naturally works. See `ProjectsService.setMembers`/`getMembers`.

## Cross-Team Section View

`GET /dashboard/section-view?week=&section=BLOCKERS|ACHIEVEMENTS|PLANNED_TASKS` lets a manager see one section of every team member's report side by side for a given week, including members who haven't started yet. See `DashboardService.getSectionView`.

## AI Assistant

Manager-only, and inert (returns a clean `503`, not a crash) unless `ANTHROPIC_API_KEY` is set:

- `GET /ai/team-summary?week=` — a short written summary of the week.
- `POST /ai/chat` with `{ week, question }` — ad-hoc Q&A over the same week's data.

Both endpoints are backed by `AnalyticsService.getTeamWeekContext`, which builds a **bounded, structured** summary of one week (capped list sizes, truncated free text) — this is deliberately not the same data DashboardService returns for on-screen charts; it exists specifically so the model's context can't grow unbounded on a busy week. The system prompt fences that data explicitly as content to summarize, never as instructions, since blocker/achievement text is free-form input written by team members, not by the manager asking the question — see the comment above `buildSystemPrompt` in `ai.service.ts` for the full reasoning.

## Running with Docker

```bash
cp .env.example .env   # at the repo root — fill in JWT_SECRET, optionally ANTHROPIC_API_KEY
docker compose up --build
```

This starts Postgres, the backend (`db push` syncs the schema on boot — see the comment in `backend/Dockerfile` for why not `migrate deploy`), and the frontend. Seed demo data once the stack is up:

```bash
docker compose exec backend npm run prisma:seed
```

## Future Improvements

- Email-based invite flow for new users (currently an admin sets the initial password directly)
- Rate limiting on auth endpoints
- Full-text search across report notes/blockers
- Committed Prisma migrations (currently schema-push based — see `Dockerfile` comment)
