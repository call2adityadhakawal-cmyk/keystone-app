# KEYSTONE — Field Service Management (simple demo build)

A minimal, single-JAR version of the Project KEYSTONE brief: Spring Boot backend +
a plain HTML/CSS/JS front end, served from the same app on `localhost:8080`.
No Docker, no Postgres install, no separate frontend server — just Java + Maven.

## What's inside

- **Backend:** Java 17, Spring Boot 3, Spring Security (stateless JWT), Spring Data JPA.
- **Database:** embedded H2, stored as a file under `./data/keystone.mv.db`. Survives restarts.
  Browsable at `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:file:./data/keystone`, user `sa`, no password).
- **Frontend:** plain HTML/CSS/JS in `src/main/resources/static` — no npm/React build step needed to run it.
- **Covers:** login (4 roles), the work-order lifecycle state machine (NEW → ASSIGNED → IN_PROGRESS →
  ON_HOLD → COMPLETED → CLOSED/CANCELLED) enforced server-side, a Kanban board, create work order,
  assign technician, role-scoped visibility, and a small dashboard.

## Run it

```bash
cd /Users/madanhk/keystone-app
mvn spring-boot:run
```

or, using the already-built jar:

```bash
java -jar target/keystone-app.jar
```

Then open **http://localhost:8080** in a browser.

To stop it: `Ctrl+C` in that terminal, or `pkill -f keystone-app.jar`.

## Accounts

The app opens on a **sign-in** page. New customers and technicians create their own
account from **Create an account** (`/register.html`) — sign-up puts them straight into
the app. Dispatcher and manager are internal admin roles: `/api/auth/register` rejects
them, so those accounts only come from the seeder (or an admin adding rows).

Customer sign-up asks for a company name. If it matches a company already in the
database (case-insensitive) the login is attached to it; otherwise a new company record
is created.

Password rule: at least 8 characters, with at least one letter and one number.

### Seed logins (password for all: `Password123!`)

These are created once against an empty database and are no longer shown anywhere in
the UI — keep them here.

| Role | Email |
|---|---|
| Dispatcher | dispatcher@keystone.dev |
| Manager | manager@keystone.dev |
| Technician | tech1@keystone.dev / tech2@keystone.dev |
| Customer | customer@keystone.dev |

## Starting over with a clean database

Data lives in `./data/keystone.mv.db`. To wipe it and reseed on next start:

```bash
rm -rf data
```

## Notes

- This is deliberately smaller in scope than the full brief (no parts/stock, no time
  logging, no scheduled SLA-breach job) — it's meant as a simple runnable demo of the
  core mechanic: the governed work-order lifecycle with server-enforced roles.
- Everything is enforced on the server (Spring Security `@PreAuthorize` + service-layer
  checks) — the UI just reflects what it's allowed to do, it isn't the security boundary.
