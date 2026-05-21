# CS 436 — Team 20/308 E-Commerce Project

Full-stack e-commerce demo built for the CS 436 cloud computing course.

- **Frontend:** React 19 + TypeScript + Vite (served by nginx in the docker build)
- **Backend:** Node.js + Express + Sequelize ORM
- **Database:** MySQL 8 (locally via Docker Compose, on AWS via **Amazon RDS MySQL**)

## Repository layout

| Path | Purpose |
| --- | --- |
| `team20_308_project_frontend/` | React frontend (Vite + nginx) |
| `team_20_308_project_backend/` | Express + Sequelize backend, seed scripts |
| `docker-compose.yml` | Local stack: `mysql`, `api`, `web` |
| `.env.example` | Template for local environment variables |
| `docs/` | Roadmaps and design notes |
| `project_requirements/` | Instructor emails + report template |

## Quick start (local Docker Compose)

```powershell
# 1. Clone, then copy environment template
copy .env.example .env

# 2. Build and start the full stack (mysql + api + web)
docker compose up --build

# 3. In a second terminal, seed demo data the first time
docker compose exec api npm run db:seed
```

Then open:

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:5002/health>

To stop:

```powershell
docker compose down
```

To **reset the database volume** (wipes all data):

```powershell
docker compose down -v
docker compose up --build
docker compose exec api npm run db:seed
```

## Demo accounts

Seeded by `npm run db:seed`:

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@example.com` | `Customer123!` |
| Product manager | `pm@example.com` | `Product123!` |
| Sales manager | `sm@example.com` | `Sales123!` |

Plus four reviewer accounts (`reviewer1..4@example.com` / `Reviewer123!`) that own the seeded comments and ratings.

## What the seeder creates

- 5 categories: Laptops, Phones, TV/Video/Audio, Headphones, Cameras & Drones
- 20 products (4 per category) with a realistic mix of normal stock, low stock and out-of-stock items
- Ratings, approved comments, and pending comments (for the PM moderation demo)
- Wishlist items for the demo customer
- 5 demo orders in states `processing`, `in-transit`, `delivered`, `refund-requested`

Re-running `npm run db:seed` is safe — products are upserted by serial number, and the demo workflow rows (orders, comments, ratings, wishlist) are cleared by demo userId before each run. No unrelated user-created data is touched.

To remove just the workflow data without dropping the database:

```powershell
docker compose exec api npm run db:seed:undo
```

## Working without Docker (optional)

If you have MySQL 8 running locally, point the backend at it:

```powershell
copy .env.example .env
# edit .env: set DB_HOST=127.0.0.1 (or your host) and the matching DB_USER/DB_PASS

cd team_20_308_project_backend
npm install
npm run db:seed
npm start

# in a second terminal
cd team20_308_project_frontend
npm install
npm run dev
```

## AWS deployment notes

- **Do not** run the `mysql` service from `docker-compose.yml` in AWS. Use **Amazon RDS MySQL** instead — RDS gives managed backups, monitoring, multi-AZ, and a much stronger story for the CS 436 report.
- Move `JWT_SECRET`, RDS credentials, and email credentials into **AWS Secrets Manager**, then inject them into the ECS task definition.
- Replace the local SMTP credentials (`EMAIL_USER` / `EMAIL_PASS`) with **Amazon SES**.
- See [docs/CS436_AWS_ROADMAP.md](docs/CS436_AWS_ROADMAP.md) for the full target architecture.

## Documentation

- [docs/CS436_AWS_ROADMAP.md](docs/CS436_AWS_ROADMAP.md) — overall cloud architecture plan
- [docs/DATABASE_DEMO_READINESS_ROADMAP.md](docs/DATABASE_DEMO_READINESS_ROADMAP.md) — database/demo-readiness roadmap
- [project_requirements/](project_requirements/) — instructor emails and report template
